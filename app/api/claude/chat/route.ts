import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
})

// Helper: Get local date string (server timezone-aware)
function getLocalDateString(date: Date = new Date()): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

// Types for tool execution
interface ToolInput {
    [key: string]: any
}

interface ActionExecuted {
    tool: string
    input: ToolInput
    result: string
}

// Helper: Build context for Claude
async function buildContext(userId: string, supabase: any, userTimezone?: string) {
    const now = new Date()
    
    // If user's timezone is provided, use it to format the current time
    let currentTime: string
    let today: string
    let displayDate: string
    
    if (userTimezone) {
        // Format time in user's timezone
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: userTimezone,
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })
        currentTime = formatter.format(now)
        
        // Format date in user's timezone (including weekday)
        const dateFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: userTimezone,
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        })
        displayDate = dateFormatter.format(now) // e.g., "Saturday, November 30, 2025"
        
        // Also get parts for YYYY-MM-DD format
        const partsFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: userTimezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        })
        const parts = partsFormatter.formatToParts(now)
        const year = parts.find(p => p.type === 'year')?.value
        const month = parts.find(p => p.type === 'month')?.value
        const day = parts.find(p => p.type === 'day')?.value
        today = `${year}-${month}-${day}`
        
        console.log(`[Timezone Debug] Server UTC: ${now.toISOString()}, User TZ: ${userTimezone}, Formatted: ${displayDate} ${currentTime}`)
    } else {
        // Fallback to server time
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        today = `${year}-${month}-${day}`
        
        const hours = now.getHours()
        const minutes = String(now.getMinutes()).padStart(2, '0')
        const period = hours >= 12 ? 'PM' : 'AM'
        const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
        currentTime = `${hour12}:${minutes} ${period}`
        
        // Format display date
        displayDate = now.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        })
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()
    
    if (profileError && profileError.code !== 'PGRST116') {
        console.log('Error fetching user profile:', profileError)
    }
    console.log('User profile loaded:', userProfile ? 'Yes' : 'No', userProfile?.intake_completed ? '(intake completed)' : '(intake not completed)')

    // Get most recent quarterly plan
    const { data: quarterlyPlans } = await supabase
        .from('quarterly_plans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)

    const quarterlyPlan = quarterlyPlans?.[0]

    // Get current week's weekly plan
    let weekStartString: string
    if (userTimezone) {
        // Get day of week in user's timezone
        const dayFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: userTimezone,
            weekday: 'short'
        })
        const dayName = dayFormatter.format(now)
        const dayMap: { [key: string]: number } = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 }
        const dayOfWeek = dayMap[dayName]
        
        // Calculate week start in user's timezone
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - dayOfWeek)
        
        const weekDateFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: userTimezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        })
        const weekParts = weekDateFormatter.formatToParts(weekStart)
        const weekYear = weekParts.find(p => p.type === 'year')?.value
        const weekMonth = weekParts.find(p => p.type === 'month')?.value
        const weekDay = weekParts.find(p => p.type === 'day')?.value
        weekStartString = `${weekYear}-${weekMonth}-${weekDay}`
    } else {
        // Fallback to server time
        const dayOfWeek = now.getDay()
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - dayOfWeek)
        const weekStartYear = weekStart.getFullYear()
        const weekStartMonth = String(weekStart.getMonth() + 1).padStart(2, '0')
        const weekStartDay = String(weekStart.getDate()).padStart(2, '0')
        weekStartString = `${weekStartYear}-${weekStartMonth}-${weekStartDay}`
    }

    const { data: weeklyPlans } = await supabase
        .from('weekly_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start', weekStartString)

    const weeklyPlan = weeklyPlans?.[0]

    // Get today's time blocks
    const { data: timeBlocks } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .order('start_time', { ascending: true })

    // Get active tasks (max 3)
    const { data: activeTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(3)

    // Get queued tasks (backlog with queue_position)
    const { data: queuedTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'backlog')
        .not('queue_position', 'is', null)
        .order('queue_position', { ascending: true })

    // Get all active projects
    const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['active', 'on_hold'])
        .order('priority', { ascending: false })

    // Get backlog tasks (not queued)
    const { data: backlogTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'backlog')
        .not('queue_position', 'is', null)
        .order('queue_position', { ascending: true})
        .limit(5)

    // Get future time blocks (next 7 days) in local timezone
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    const sevenYear = sevenDaysFromNow.getFullYear()
    const sevenMonth = String(sevenDaysFromNow.getMonth() + 1).padStart(2, '0')
    const sevenDay = String(sevenDaysFromNow.getDate()).padStart(2, '0')
    const sevenDaysStr = `${sevenYear}-${sevenMonth}-${sevenDay}`

    const { data: futureBlocks } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('user_id', userId)
        .gt('date', today)
        .lte('date', sevenDaysStr)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })

    // Get recent notes (last 30 days) with tags - using local timezone
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyYear = thirtyDaysAgo.getFullYear()
    const thirtyMonth = String(thirtyDaysAgo.getMonth() + 1).padStart(2, '0')
    const thirtyDay = String(thirtyDaysAgo.getDate()).padStart(2, '0')
    const thirtyDaysAgoStr = `${thirtyYear}-${thirtyMonth}-${thirtyDay}`

    const { data: recentNotes } = await supabase
        .from('notes')
        .select(`
            *,
            note_tags (*)
        `)
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgoStr)
        .order('created_at', { ascending: false })
        .limit(20)

    // Get behaviors with recent check-ins
    const { data: behaviors } = await supabase
        .from('behaviors')
        .select('*')
        .eq('user_id', userId)

    const { data: recentCheckins } = await supabase
        .from('behavior_checkins')
        .select('*')
        .eq('user_id', userId)
        .gte('date', thirtyDaysAgoStr)
        .order('date', { ascending: false })

    // Get recent conversation history (last 15 messages)
    const { data: conversationHistory } = await supabase
        .from('ai_conversations')
        .select('message, response, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(15)

    // Get task reviews with task details (last 50)
    const { data: taskReviews } = await supabase
        .from('task_reviews')
        .select('*, task:tasks(title, tags)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

    // Get project reviews with project details (last 20)
    const { data: projectReviews } = await supabase
        .from('project_reviews')
        .select('*, project:projects(project_name, tags)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

    // Calculate work patterns from reviews
    const workPatterns = calculateWorkPatterns(taskReviews || [], projectReviews || [])

    return {
        today,
        displayDate,
        currentTime,
        userProfile: userProfile || null,
        quarterlyPlan,
        weeklyPlan,
        timeBlocks: timeBlocks || [],
        futureBlocks: futureBlocks || [],
        activeTasks: activeTasks || [],
        queuedTasks: queuedTasks || [],
        backlogTasks: backlogTasks || [],
        projects: projects || [],
        recentNotes: recentNotes || [],
        behaviors: behaviors || [],
        recentCheckins: recentCheckins || [],
        conversationHistory: conversationHistory?.reverse() || [], // Reverse to chronological order
        taskReviews: taskReviews || [],
        projectReviews: projectReviews || [],
        workPatterns,
    }
}

// Helper: Calculate work patterns from review data
function calculateWorkPatterns(taskReviews: any[], projectReviews: any[]): any {
    const allReviews = [...taskReviews, ...projectReviews]
    
    if (allReviews.length === 0) {
        return {
            highEnergyTags: [],
            enjoyedTags: [],
            drainedByTags: [],
            preferredDifficulty: null,
            tagStats: {}
        }
    }

    // Aggregate stats by tag
    const tagStats: Record<string, {
        count: number
        totalEnjoyment: number
        totalEnergy: number
        energyLevels: { low: number, medium: number, high: number }
        difficulties: { easy: number, medium: number, hard: number }
    }> = {}

    allReviews.forEach((review) => {
        const tags = review.task?.tags || review.project?.tags || []
        
        tags.forEach((tag: string) => {
            if (!tagStats[tag]) {
                tagStats[tag] = {
                    count: 0,
                    totalEnjoyment: 0,
                    totalEnergy: 0,
                    energyLevels: { low: 0, medium: 0, high: 0 },
                    difficulties: { easy: 0, medium: 0, hard: 0 }
                }
            }

            tagStats[tag].count++
            tagStats[tag].totalEnjoyment += review.enjoyment_rating || 0
            
            // Energy level tracking
            const energy = review.energy_required
            if (energy === 'high') {
                tagStats[tag].totalEnergy += 3
                tagStats[tag].energyLevels.high++
            } else if (energy === 'medium') {
                tagStats[tag].totalEnergy += 2
                tagStats[tag].energyLevels.medium++
            } else {
                tagStats[tag].totalEnergy += 1
                tagStats[tag].energyLevels.low++
            }

            // Difficulty tracking
            const difficulty = review.difficulty
            if (difficulty) {
                tagStats[tag].difficulties[difficulty as 'easy' | 'medium' | 'hard']++
            }
        })
    })

    // Identify patterns
    const highEnergyTags: string[] = []
    const enjoyedTags: string[] = []
    const drainedByTags: string[] = []

    Object.entries(tagStats).forEach(([tag, stats]) => {
        const avgEnjoyment = stats.totalEnjoyment / stats.count
        const avgEnergy = stats.totalEnergy / stats.count

        // High energy: average energy >= 2.5 (between medium and high)
        if (avgEnergy >= 2.5) {
            highEnergyTags.push(tag)
        }

        // Enjoyed: average enjoyment >= 4
        if (avgEnjoyment >= 4) {
            enjoyedTags.push(tag)
        }

        // Drained by: high energy but low enjoyment
        if (avgEnergy >= 2.5 && avgEnjoyment < 3) {
            drainedByTags.push(tag)
        }
    })

    // Calculate preferred difficulty
    let difficultyCount = { easy: 0, medium: 0, hard: 0 }
    allReviews.forEach(review => {
        if (review.difficulty) {
            difficultyCount[review.difficulty as 'easy' | 'medium' | 'hard']++
        }
    })
    const preferredDifficulty = Object.entries(difficultyCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null

    return {
        highEnergyTags,
        enjoyedTags,
        drainedByTags,
        preferredDifficulty,
        tagStats
    }
}

// Helper: Format context into system prompt
function formatSystemPrompt(context: any) {
    const { today, displayDate, currentTime, userProfile, quarterlyPlan, weeklyPlan, timeBlocks, futureBlocks, activeTasks, queuedTasks, backlogTasks, projects, recentNotes, behaviors, recentCheckins, taskReviews, projectReviews, workPatterns } = context

    const userName = userProfile?.display_name || 'there'
    const aiName = userProfile?.ai_name || 'Claude'
    const aiPersonality = userProfile?.ai_personality || 'supportive'
    const reminderStyle = userProfile?.reminder_style || 'gentle'

    // Build personality instruction based on preferences
    let personalityInstruction = ''
    switch (aiPersonality) {
        case 'supportive':
            personalityInstruction = 'Be warm, encouraging, and positive. Celebrate wins and gently guide through challenges.'
            break
        case 'direct':
            personalityInstruction = 'Be straightforward and honest. Get to the point quickly without fluff.'
            break
        case 'analytical':
            personalityInstruction = 'Be data-driven and logical. Reference patterns and metrics when possible.'
            break
        case 'motivational':
            personalityInstruction = 'Be high-energy and inspiring. Use powerful language to motivate action.'
            break
    }

    let prompt = `You are ${aiName}, ${userName}'s personal productivity assistant in the Yinsen app, focused on meaningful productivity and helping them not waste their life. When asked your name, say you are ${aiName}.

PERSONALITY: ${personalityInstruction}
REMINDER STYLE: ${reminderStyle}
${userProfile?.wants_accountability ? 'HOLD USER ACCOUNTABLE: Yes - check in on their progress and commitments.' : ''}
${userProfile?.wants_suggestions ? 'PROACTIVE SUGGESTIONS: Yes - recommend improvements to their workflow.' : ''}
${userProfile?.wants_insights ? 'SHARE INSIGHTS: Yes - help them understand their productivity patterns.' : ''}

CURRENT DATE/TIME: ${displayDate} ${currentTime}

`

    // Add user profile context
    if (userProfile) {
        prompt += `USER PROFILE:
- Name: ${userName}
- Work Style: ${userProfile.work_style || 'Not specified'}
- Chronotype: ${userProfile.chronotype || 'Not specified'}
- Peak Hours: ${userProfile.peak_hours_start}-${userProfile.peak_hours_end}
- Preferred Work Duration: ${userProfile.preferred_work_duration} minutes
- Preferred Break Duration: ${userProfile.preferred_break_duration} minutes
- Employment: ${userProfile.employment_type || 'Not specified'}
${userProfile.has_fixed_schedule ? `- Fixed Schedule: ${userProfile.typical_work_start}-${userProfile.typical_work_end}` : ''}
${userProfile.motivations?.length > 0 ? `- Motivations: ${userProfile.motivations.join(', ')}` : ''}
${userProfile.goals_short_term ? `- Short-term Goals: ${userProfile.goals_short_term}` : ''}
${userProfile.goals_long_term ? `- Long-term Goals: ${userProfile.goals_long_term}` : ''}
${userProfile.health_considerations?.length > 0 ? `- Health Considerations: ${userProfile.health_considerations.join(', ')}` : ''}
${userProfile.accommodation_preferences ? `- Accommodation Preferences: ${userProfile.accommodation_preferences}` : ''}
${userProfile.has_caregiving_responsibilities ? '- Has Caregiving Responsibilities: Yes' : ''}

`
    }

    // Add work patterns from reviews
    if (workPatterns && (taskReviews.length > 0 || projectReviews.length > 0)) {
        prompt += `WORK PATTERNS & PREFERENCES (from ${taskReviews.length + projectReviews.length} completed reviews):
`

        if (workPatterns.enjoyedTags.length > 0) {
            prompt += `- Most Enjoyed Work: ${workPatterns.enjoyedTags.join(', ')}
`
        }

        if (workPatterns.highEnergyTags.length > 0) {
            prompt += `- High Energy Required: ${workPatterns.highEnergyTags.join(', ')}
`
        }

        if (workPatterns.drainedByTags.length > 0) {
            prompt += `- Draining Work (high energy, low enjoyment): ${workPatterns.drainedByTags.join(', ')}
`
        }

        if (workPatterns.preferredDifficulty) {
            prompt += `- Preferred Difficulty: ${workPatterns.preferredDifficulty}
`
        }

        prompt += `
SCHEDULING GUIDELINES BASED ON REVIEWS:
1. Schedule high-energy work (${workPatterns.highEnergyTags.join(', ')}) during peak hours (${userProfile?.peak_hours_start || '9:00'}-${userProfile?.peak_hours_end || '12:00'})
2. Batch similar task types together (same tags) to reduce context switching
3. Avoid scheduling more than 2 consecutive high-energy tasks
4. Intersperse draining work with enjoyable tasks for motivation
5. Reference past review feedback when suggesting task timing or work planning

`
    }

    prompt += `QUARTERLY OBJECTIVES:
`

    if (quarterlyPlan && quarterlyPlan.objectives && quarterlyPlan.objectives.length > 0) {
        quarterlyPlan.objectives.forEach((obj: string, i: number) => {
            prompt += `${i + 1}. ${obj}\n`
        })
    } else {
        prompt += 'None set\n'
    }

    prompt += '\nTHIS WEEK\'S PLAN:\n'
    if (weeklyPlan && weeklyPlan.plan_text) {
        prompt += weeklyPlan.plan_text + '\n'
    } else {
        prompt += 'No plan yet\n'
    }

    prompt += '\nTODAY\'S SCHEDULE:\n'
    if (timeBlocks.length > 0) {
        timeBlocks.forEach((block: any) => {
            const checkmark = block.completed ? ' ✓' : ''
            const title = block.task_title ? ` - ${block.task_title}` : ''
            prompt += `${block.start_time}-${block.end_time}: ${block.block_type}${title}${checkmark}\n`
        })
    } else {
        prompt += 'No blocks scheduled\n'
    }

    prompt += `\nACTIVE PROJECTS (${activeTasks.length}/3):\n`
    if (activeTasks.length > 0) {
        activeTasks.forEach((task: any, i: number) => {
            prompt += `${i + 1}. ${task.title}\n`
        })
    } else {
        prompt += 'None\n'
    }

    prompt += `\nQUEUED TASKS (${queuedTasks.length}):\n`
    if (queuedTasks.length > 0) {
        queuedTasks.slice(0, 5).forEach((task: any, i: number) => {
            prompt += `${i + 1}. ${task.title}\n`
        })
    } else {
        prompt += 'None\n'
    }

    // Future schedule
    prompt += `\nUPCOMING SCHEDULE (Next 7 Days):\n`
    if (futureBlocks.length > 0) {
        let currentDate = ''
        futureBlocks.forEach((block: any) => {
            if (block.date !== currentDate) {
                currentDate = block.date
                const dateObj = new Date(block.date + 'T12:00:00')
                const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                prompt += `\n${dateStr}:\n`
            }
            const title = block.task_title ? ` - ${block.task_title}` : ''
            prompt += `  ${block.start_time}-${block.end_time}: ${block.block_type}${title}\n`
        })
    } else {
        prompt += 'No future blocks scheduled\n'
    }

    // Recent notes
    prompt += `\nRECENT NOTES (Last 30 Days - ${recentNotes.length}):\n`
    if (recentNotes.length > 0) {
        recentNotes.slice(0, 10).forEach((note: any, i: number) => {
            const tags = note.note_tags?.map((t: any) => t.tag_value).join(', ') || 'no tags'
            const source = note.source_name ? ` from ${note.source_name}` : ''
            prompt += `${i + 1}. "${note.title}"${source} [${tags}]\n`
            prompt += `   ${note.content.substring(0, 150)}${note.content.length > 150 ? '...' : ''}\n`
        })
    } else {
        prompt += 'No notes yet\n'
    }

    // Behaviors
    const rewardingBehaviors = behaviors.filter((b: any) => b.is_rewarding)
    const nonRewardingBehaviors = behaviors.filter((b: any) => !b.is_rewarding)

    prompt += `\nBEHAVIOR TRACKING:\n`
    prompt += `Rewarding Behaviors (${rewardingBehaviors.length}):\n`
    if (rewardingBehaviors.length > 0) {
        rewardingBehaviors.slice(0, 5).forEach((b: any) => {
            const checkins = recentCheckins.filter((c: any) => c.behavior_id === b.id && c.completed)
            prompt += `- ${b.behavior_name} (${b.frequency}) - ${checkins.length} check-ins in last 30 days\n`
        })
    } else {
        prompt += '- None tracked\n'
    }

    prompt += `Non-Rewarding Behaviors (${nonRewardingBehaviors.length}):\n`
    if (nonRewardingBehaviors.length > 0) {
        nonRewardingBehaviors.slice(0, 5).forEach((b: any) => {
            const checkins = recentCheckins.filter((c: any) => c.behavior_id === b.id)
            prompt += `- ${b.behavior_name} (${b.frequency}) - ${checkins.length} occurrences in last 30 days\n`
        })
    } else {
        prompt += '- None tracked\n'
    }

    prompt += `
RULES:
1. Maximum 3 active tasks - enforce strictly
2. Time blocks cannot overlap
3. Reference quarterly goals when planning
4. Be concise and direct
5. Always confirm actions you've taken
6. Consider user's chronotype and peak hours when suggesting schedules
7. Respect any health accommodations mentioned in the profile
8. Use the user's preferred work/break durations as defaults
9. Only perform actions the user explicitly asks for - never modify or delete without clear instruction

YOUR FULL CAPABILITIES (use tools to execute these):
📅 TIME BLOCKS: Create, update, delete, mark complete
📋 TASKS: Add to queue, update details, delete, pull to active (max 3), complete
📝 NOTES: Create new notes, update existing, delete, manage tags
🎯 BEHAVIORS: Create trackers, update, delete, log daily check-ins with scores
📊 PLANS: Update weekly plans, update quarterly objectives
⏰ WORK HOURS: Set work hours for any day of the week

PROACTIVE CAPABILITIES:
- Identify blind spots in user's planning or patterns
- Notice when commitments don't align with stated goals
- Suggest optimizations based on their work style
- Celebrate progress and completed tasks
- Flag potential burnout or overcommitment

You have FULL ACCESS to manage ${userName}'s productivity system including their schedule, tasks, notes, behaviors, and plans. Execute any requested action immediately using your tools, and always confirm what you've done.`

    return prompt
}

// Tool definitions - Full agency over the application
const tools: Anthropic.Tool[] = [
    // ==================== TIME BLOCKS ====================
    {
        name: 'create_time_block',
        description: 'Create a new time block in the schedule. Validates no overlaps exist.',
        input_schema: {
            type: 'object',
            properties: {
                date: { type: 'string', description: 'Date in YYYY-MM-DD format. Defaults to today.' },
                start_time: { type: 'string', description: 'Start time in HH:MM format (24-hour)' },
                end_time: { type: 'string', description: 'End time in HH:MM format (24-hour)' },
                block_type: { type: 'string', enum: ['deep_work', 'shallow_work', 'break', 'personal', 'meeting'], description: 'Type of time block' },
                task_title: { type: 'string', description: 'Optional title/description for the block' },
            },
            required: ['start_time', 'end_time', 'block_type'],
        },
    },
    {
        name: 'update_time_block',
        description: 'Update an existing time block',
        input_schema: {
            type: 'object',
            properties: {
                block_id: { type: 'string', description: 'ID of the time block to update' },
                start_time: { type: 'string', description: 'New start time in HH:MM format' },
                end_time: { type: 'string', description: 'New end time in HH:MM format' },
                block_type: { type: 'string', enum: ['deep_work', 'shallow_work', 'break', 'personal', 'meeting'] },
                task_title: { type: 'string', description: 'New title for the block' },
                completed: { type: 'boolean', description: 'Mark as completed or not' },
            },
            required: ['block_id'],
        },
    },
    {
        name: 'delete_time_block',
        description: 'Delete a time block from the schedule',
        input_schema: {
            type: 'object',
            properties: {
                block_id: { type: 'string', description: 'ID of the time block to delete' },
            },
            required: ['block_id'],
        },
    },
    // ==================== TASKS ====================
    {
        name: 'add_task',
        description: 'Add a new task to the backlog queue',
        input_schema: {
            type: 'object',
            properties: {
                title: { type: 'string', description: 'Task title' },
                notes: { type: 'string', description: 'Optional notes about the task' },
            },
            required: ['title'],
        },
    },
    {
        name: 'update_task',
        description: 'Update an existing task',
        input_schema: {
            type: 'object',
            properties: {
                task_id: { type: 'string', description: 'ID of the task to update' },
                title: { type: 'string', description: 'New title' },
                notes: { type: 'string', description: 'New notes' },
                status: { type: 'string', enum: ['backlog', 'active', 'completed', 'archived'], description: 'New status' },
            },
            required: ['task_id'],
        },
    },
    {
        name: 'delete_task',
        description: 'Delete a task permanently',
        input_schema: {
            type: 'object',
            properties: {
                task_id: { type: 'string', description: 'ID of the task to delete' },
            },
            required: ['task_id'],
        },
    },
    {
        name: 'pull_task',
        description: 'Pull a task from queue to active status. Enforces 3-task limit.',
        input_schema: {
            type: 'object',
            properties: {
                task_id: { type: 'string', description: 'ID of the task to pull' },
            },
            required: ['task_id'],
        },
    },
    {
        name: 'complete_task',
        description: 'Mark an active task as completed',
        input_schema: {
            type: 'object',
            properties: {
                task_id: { type: 'string', description: 'ID of the task to complete' },
            },
            required: ['task_id'],
        },
    },
    // ==================== NOTES ====================
    {
        name: 'create_note',
        description: 'Create a new note in the notebook',
        input_schema: {
            type: 'object',
            properties: {
                title: { type: 'string', description: 'Note title' },
                content: { type: 'string', description: 'Note content (can include markdown/HTML)' },
                source_type: { type: 'string', enum: ['general', 'book', 'podcast', 'idea'], description: 'Type of source' },
                source_name: { type: 'string', description: 'Name of source (e.g., book title)' },
                tags: { type: 'array', items: { type: 'string' }, description: 'Array of tag strings' },
            },
            required: ['title', 'content'],
        },
    },
    {
        name: 'update_note',
        description: 'Update an existing note',
        input_schema: {
            type: 'object',
            properties: {
                note_id: { type: 'string', description: 'ID of the note to update' },
                title: { type: 'string', description: 'New title' },
                content: { type: 'string', description: 'New content' },
                source_type: { type: 'string', enum: ['general', 'book', 'podcast', 'idea'] },
                source_name: { type: 'string', description: 'New source name' },
                tags: { type: 'array', items: { type: 'string' }, description: 'New tags (replaces existing)' },
            },
            required: ['note_id'],
        },
    },
    {
        name: 'delete_note',
        description: 'Delete a note permanently',
        input_schema: {
            type: 'object',
            properties: {
                note_id: { type: 'string', description: 'ID of the note to delete' },
            },
            required: ['note_id'],
        },
    },
    // ==================== BEHAVIORS ====================
    {
        name: 'create_behavior',
        description: 'Create a new behavior to track',
        input_schema: {
            type: 'object',
            properties: {
                behavior_name: { type: 'string', description: 'Name of the behavior' },
                description: { type: 'string', description: 'Description of the behavior' },
                frequency: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'yearly'], description: 'How often to track' },
                is_rewarding: { type: 'boolean', description: 'true if this behavior rewards the user, false if trying to reduce it' },
                category: { type: 'string', description: 'Category like health, work, relationships, finance' },
            },
            required: ['behavior_name', 'frequency', 'is_rewarding'],
        },
    },
    {
        name: 'update_behavior',
        description: 'Update an existing behavior',
        input_schema: {
            type: 'object',
            properties: {
                behavior_id: { type: 'string', description: 'ID of the behavior to update' },
                behavior_name: { type: 'string' },
                description: { type: 'string' },
                frequency: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'yearly'] },
                is_rewarding: { type: 'boolean' },
                category: { type: 'string' },
            },
            required: ['behavior_id'],
        },
    },
    {
        name: 'delete_behavior',
        description: 'Delete a behavior and its check-ins',
        input_schema: {
            type: 'object',
            properties: {
                behavior_id: { type: 'string', description: 'ID of the behavior to delete' },
            },
            required: ['behavior_id'],
        },
    },
    {
        name: 'log_behavior_checkin',
        description: 'Log a check-in for a behavior (did it today, how rewarding was it)',
        input_schema: {
            type: 'object',
            properties: {
                behavior_id: { type: 'string', description: 'ID of the behavior' },
                date: { type: 'string', description: 'Date in YYYY-MM-DD format. Defaults to today.' },
                completed: { type: 'boolean', description: 'Whether the behavior was completed/occurred' },
                outcome_notes: { type: 'string', description: 'Notes about how it went' },
                reward_score: { type: 'number', description: 'How rewarding it was (1-10)' },
            },
            required: ['behavior_id', 'completed'],
        },
    },
    // ==================== PLANS ====================
    {
        name: 'update_weekly_plan',
        description: 'Create or update the weekly plan for the current week',
        input_schema: {
            type: 'object',
            properties: {
                plan_text: { type: 'string', description: 'The weekly plan text' },
            },
            required: ['plan_text'],
        },
    },
    {
        name: 'update_quarterly_plan',
        description: 'Create or update the quarterly plan',
        input_schema: {
            type: 'object',
            properties: {
                quarter: { type: 'string', description: 'Quarter identifier (e.g., "2024-Q4")' },
                objectives: { type: 'array', items: { type: 'string' }, description: 'Array of objective strings' },
            },
            required: ['quarter', 'objectives'],
        },
    },
    // ==================== WORK HOURS ====================
    {
        name: 'set_work_hours',
        description: 'Set work hours for a specific day of the week',
        input_schema: {
            type: 'object',
            properties: {
                day_of_week: { type: 'number', description: 'Day of week (0=Sunday, 6=Saturday)' },
                start_time: { type: 'string', description: 'Start time in HH:MM format' },
                end_time: { type: 'string', description: 'End time in HH:MM format' },
                is_enabled: { type: 'boolean', description: 'Whether this is a work day' },
            },
            required: ['day_of_week', 'start_time', 'end_time', 'is_enabled'],
        },
    },
    // ==================== SCHEDULE OPTIMIZATION ====================
    {
        name: 'analyze_schedule',
        description: 'Analyze time blocks for a date to identify optimization opportunities based on user review patterns and preferences. Returns optimization score and specific issues.',
        input_schema: {
            type: 'object',
            properties: {
                date: { type: 'string', description: 'Date to analyze in YYYY-MM-DD format' },
            },
            required: ['date'],
        },
    },
    {
        name: 'get_task_insights',
        description: 'Analyze historical task/project reviews to provide insights on work patterns, preferences, and optimal timing for different types of work.',
        input_schema: {
            type: 'object',
            properties: {
                tag_filter: { 
                    type: 'array', 
                    items: { type: 'string' },
                    description: 'Optional: Filter insights by specific tags' 
                },
                date_range_days: { 
                    type: 'number', 
                    description: 'Optional: Number of days to look back (default: 30)' 
                },
            },
        },
    },
]

// Tool execution handlers
async function executeToolCall(
    toolName: string,
    toolInput: ToolInput,
    userId: string,
    supabase: any
): Promise<string> {
    try {
        switch (toolName) {
            // Time Blocks
            case 'create_time_block':
                return await createTimeBlock(toolInput, userId, supabase)
            case 'update_time_block':
                return await updateTimeBlock(toolInput, userId, supabase)
            case 'delete_time_block':
                return await deleteTimeBlock(toolInput, userId, supabase)
            // Tasks
            case 'add_task':
                return await addTask(toolInput, userId, supabase)
            case 'update_task':
                return await updateTask(toolInput, userId, supabase)
            case 'delete_task':
                return await deleteTask(toolInput, userId, supabase)
            case 'pull_task':
                return await pullTask(toolInput, userId, supabase)
            case 'complete_task':
                return await completeTask(toolInput, userId, supabase)
            // Notes
            case 'create_note':
                return await createNote(toolInput, userId, supabase)
            case 'update_note':
                return await updateNote(toolInput, userId, supabase)
            case 'delete_note':
                return await deleteNote(toolInput, userId, supabase)
            // Behaviors
            case 'create_behavior':
                return await createBehavior(toolInput, userId, supabase)
            case 'update_behavior':
                return await updateBehavior(toolInput, userId, supabase)
            case 'delete_behavior':
                return await deleteBehavior(toolInput, userId, supabase)
            case 'log_behavior_checkin':
                return await logBehaviorCheckin(toolInput, userId, supabase)
            // Plans
            case 'update_weekly_plan':
                return await updateWeeklyPlan(toolInput, userId, supabase)
            case 'update_quarterly_plan':
                return await updateQuarterlyPlan(toolInput, userId, supabase)
            // Work Hours
            case 'set_work_hours':
                return await setWorkHours(toolInput, userId, supabase)
            // Schedule Optimization
            case 'analyze_schedule':
                return await analyzeSchedule(toolInput, userId, supabase)
            case 'get_task_insights':
                return await getTaskInsights(toolInput, userId, supabase)
            default:
                return `Unknown tool: ${toolName}`
        }
    } catch (error: any) {
        return `Error executing ${toolName}: ${error.message}`
    }
}

async function createTimeBlock(input: ToolInput, userId: string, supabase: any): Promise<string> {
    const date = input.date || getLocalDateString()
    let { start_time, end_time, block_type, task_title } = input

    // Normalize time format to HH:MM:SS for consistent comparison
    const normalizeTime = (time: string): string => {
        if (time.length === 5) {
            return `${time}:00`
        }
        return time
    }

    start_time = normalizeTime(start_time)
    end_time = normalizeTime(end_time)

    // Check for overlaps
    const { data: existingBlocks } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)

    if (existingBlocks && existingBlocks.length > 0) {
        for (const block of existingBlocks) {
            // Normalize existing block times too
            const blockStart = normalizeTime(block.start_time)
            const blockEnd = normalizeTime(block.end_time)
            
            // Check for actual overlap (adjacent blocks are OK)
            if (
                (start_time >= blockStart && start_time < blockEnd) ||
                (end_time > blockStart && end_time <= blockEnd) ||
                (start_time <= blockStart && end_time >= blockEnd)
            ) {
                return `Error: Time block overlaps with existing block ${block.start_time.slice(0, 5)}-${block.end_time.slice(0, 5)} (${block.task_title || block.block_type})`
            }
        }
    }

    const { error } = await supabase.from('time_blocks').insert({
        user_id: userId,
        date,
        start_time,
        end_time,
        block_type,
        task_title: task_title || null,
        completed: false,
    })

    if (error) throw error

    return `Created ${block_type} block from ${start_time.slice(0, 5)} to ${end_time.slice(0, 5)}${task_title ? ` for "${task_title}"` : ''}`
}

async function addTask(input: ToolInput, userId: string, supabase: any): Promise<string> {
    const { title, notes } = input

    // Get max queue position
    const { data: queuedTasks } = await supabase
        .from('tasks')
        .select('queue_position')
        .eq('user_id', userId)
        .eq('status', 'backlog')
        .not('queue_position', 'is', null)
        .order('queue_position', { ascending: false })
        .limit(1)

    const maxPosition = queuedTasks && queuedTasks.length > 0 ? queuedTasks[0].queue_position : 0

    const { error } = await supabase.from('tasks').insert({
        user_id: userId,
        title,
        notes: notes || null,
        status: 'backlog',
        queue_position: maxPosition + 1,
    })

    if (error) throw error

    return `Added task "${title}" to queue at position ${maxPosition + 1}`
}

async function pullTask(input: ToolInput, userId: string, supabase: any): Promise<string> {
    const { task_id } = input

    // Check active task count
    const { data: activeTasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')

    if (activeTasks && activeTasks.length >= 3) {
        return 'Error: You already have 3 active tasks. Complete one before pulling another.'
    }

    // Get task details
    const { data: task } = await supabase
        .from('tasks')
        .select('title')
        .eq('id', task_id)
        .single()

    if (!task) {
        return 'Error: Task not found'
    }

    const { error } = await supabase
        .from('tasks')
        .update({ status: 'active' })
        .eq('id', task_id)

    if (error) throw error

    return `Pulled task "${task.title}" to active status`
}

async function completeTask(input: ToolInput, userId: string, supabase: any): Promise<string> {
    const { task_id } = input

    // Get task details
    const { data: task } = await supabase
        .from('tasks')
        .select('title')
        .eq('id', task_id)
        .single()

    if (!task) {
        return 'Error: Task not found'
    }

    const { error } = await supabase
        .from('tasks')
        .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
        })
        .eq('id', task_id)

    if (error) throw error

    return `Completed task "${task.title}"`
}

async function updateWeeklyPlan(input: ToolInput, userId: string, supabase: any): Promise<string> {
    const { plan_text } = input

    // Calculate week start
    const now = new Date()
    const dayOfWeek = now.getDay()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - dayOfWeek)
    const weekStartString = weekStart.toISOString().split('T')[0]

    // Get most recent quarterly plan for linking
    const { data: quarterlyPlans } = await supabase
        .from('quarterly_plans')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)

    const quarterlyPlanId = quarterlyPlans && quarterlyPlans.length > 0 ? quarterlyPlans[0].id : null

    // Upsert weekly plan
    const { error } = await supabase.from('weekly_plans').upsert(
        {
            user_id: userId,
            week_start: weekStartString,
            plan_text,
            quarterly_plan_id: quarterlyPlanId,
        },
        {
            onConflict: 'user_id,week_start',
        }
    )

    if (error) throw error

    return `Updated weekly plan for week starting ${weekStartString}`
}

async function updateQuarterlyPlan(input: ToolInput, userId: string, supabase: any): Promise<string> {
    const { quarter, objectives } = input

    // Upsert quarterly plan
    const { error } = await supabase.from('quarterly_plans').upsert(
        {
            user_id: userId,
            quarter,
            objectives,
        },
        {
            onConflict: 'user_id,quarter',
        }
    )

    if (error) throw error

    return `Updated quarterly plan for ${quarter} with ${objectives.length} objectives`
}

// ==================== NEW HANDLERS ====================

async function updateTimeBlock(input: ToolInput, userId: string, supabase: any): Promise<string> {
    const { block_id, start_time, end_time, block_type, task_title, completed } = input

    // Get existing block
    const { data: existingBlock } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('id', block_id)
        .eq('user_id', userId)
        .single()

    if (!existingBlock) {
        return 'Error: Time block not found'
    }

    const updateData: any = {}
    if (start_time) updateData.start_time = start_time.length === 5 ? `${start_time}:00` : start_time
    if (end_time) updateData.end_time = end_time.length === 5 ? `${end_time}:00` : end_time
    if (block_type) updateData.block_type = block_type
    if (task_title !== undefined) updateData.task_title = task_title
    if (completed !== undefined) updateData.completed = completed

    const { error } = await supabase
        .from('time_blocks')
        .update(updateData)
        .eq('id', block_id)

    if (error) throw error

    return `Updated time block "${existingBlock.task_title || existingBlock.block_type}"`
}

async function deleteTimeBlock(input: ToolInput, userId: string, supabase: any): Promise<string> {
    const { block_id } = input

    // Get block details first
    const { data: block } = await supabase
        .from('time_blocks')
        .select('task_title, block_type, start_time, end_time')
        .eq('id', block_id)
        .eq('user_id', userId)
        .single()

    if (!block) {
        return 'Error: Time block not found'
    }

    const { error } = await supabase
        .from('time_blocks')
        .delete()
        .eq('id', block_id)

    if (error) throw error

    return `Deleted time block "${block.task_title || block.block_type}" (${block.start_time.slice(0, 5)}-${block.end_time.slice(0, 5)})`
}

async function updateTask(input: ToolInput, userId: string, supabase: any): Promise<string> {
    const { task_id, title, notes, status } = input

    // Get existing task
    const { data: existingTask } = await supabase
        .from('tasks')
        .select('title')
        .eq('id', task_id)
        .eq('user_id', userId)
        .single()

    if (!existingTask) {
        return 'Error: Task not found'
    }

    const updateData: any = {}
    if (title) updateData.title = title
    if (notes !== undefined) updateData.notes = notes
    if (status) {
        updateData.status = status
        if (status === 'completed') {
            updateData.completed_at = new Date().toISOString()
        }
    }

    const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', task_id)

    if (error) throw error

    return `Updated task "${existingTask.title}"`
}

async function deleteTask(input: ToolInput, userId: string, supabase: any): Promise<string> {
    const { task_id } = input

    // Get task details first
    const { data: task } = await supabase
        .from('tasks')
        .select('title')
        .eq('id', task_id)
        .eq('user_id', userId)
        .single()

    if (!task) {
        return 'Error: Task not found'
    }

    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task_id)

    if (error) throw error

    return `Deleted task "${task.title}"`
}

async function createNote(input: ToolInput, userId: string, supabase: any): Promise<string> {
    const { title, content, source_type, source_name, tags } = input

    const { data: newNote, error } = await supabase
        .from('notes')
        .insert({
            user_id: userId,
            title,
            content,
            source_type: source_type || 'general',
            source_name: source_name || null,
        })
        .select()
        .single()

    if (error) throw error

    // Add tags if provided
    if (newNote && tags && tags.length > 0) {
        await supabase.from('note_tags').insert(
            tags.map((tag: string) => ({
                note_id: newNote.id,
                tag_type: 'concept',
                tag_value: tag,
            }))
        )
    }

    return `Created note "${title}"${tags && tags.length > 0 ? ` with tags: ${tags.join(', ')}` : ''}`
}

async function updateNote(input: ToolInput, userId: string, supabase: any): Promise<string> {
    const { note_id, title, content, source_type, source_name, tags } = input

    // Get existing note
    const { data: existingNote } = await supabase
        .from('notes')
        .select('title')
        .eq('id', note_id)
        .eq('user_id', userId)
        .single()

    if (!existingNote) {
        return 'Error: Note not found'
    }

    const updateData: any = { updated_at: new Date().toISOString() }
    if (title) updateData.title = title
    if (content) updateData.content = content
    if (source_type) updateData.source_type = source_type
    if (source_name !== undefined) updateData.source_name = source_name

    const { error } = await supabase
        .from('notes')
        .update(updateData)
        .eq('id', note_id)

    if (error) throw error

    // Update tags if provided
    if (tags !== undefined) {
        // Delete existing tags
        await supabase.from('note_tags').delete().eq('note_id', note_id)
        
        // Insert new tags
        if (tags.length > 0) {
            await supabase.from('note_tags').insert(
                tags.map((tag: string) => ({
                    note_id: note_id,
                    tag_type: 'concept',
                    tag_value: tag,
                }))
            )
        }
    }

    return `Updated note "${existingNote.title}"`
}

async function deleteNote(input: ToolInput, userId: string, supabase: any): Promise<string> {
    const { note_id } = input

    // Get note details first
    const { data: note } = await supabase
        .from('notes')
        .select('title')
        .eq('id', note_id)
        .eq('user_id', userId)
        .single()

    if (!note) {
        return 'Error: Note not found'
    }

    const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', note_id)

    if (error) throw error

    return `Deleted note "${note.title}"`
}

async function createBehavior(input: ToolInput, userId: string, supabase: any): Promise<string> {
    const { behavior_name, description, frequency, is_rewarding, category } = input

    const { error } = await supabase.from('behaviors').insert({
        user_id: userId,
        behavior_name,
        description: description || null,
        frequency,
        is_rewarding,
        category: category || null,
    })

    if (error) throw error

    return `Created ${is_rewarding ? 'rewarding' : 'non-rewarding'} behavior "${behavior_name}" (${frequency})`
}

async function updateBehavior(input: ToolInput, userId: string, supabase: any): Promise<string> {
    const { behavior_id, behavior_name, description, frequency, is_rewarding, category } = input

    // Get existing behavior
    const { data: existingBehavior } = await supabase
        .from('behaviors')
        .select('behavior_name')
        .eq('id', behavior_id)
        .eq('user_id', userId)
        .single()

    if (!existingBehavior) {
        return 'Error: Behavior not found'
    }

    const updateData: any = { updated_at: new Date().toISOString() }
    if (behavior_name) updateData.behavior_name = behavior_name
    if (description !== undefined) updateData.description = description
    if (frequency) updateData.frequency = frequency
    if (is_rewarding !== undefined) updateData.is_rewarding = is_rewarding
    if (category !== undefined) updateData.category = category

    const { error } = await supabase
        .from('behaviors')
        .update(updateData)
        .eq('id', behavior_id)

    if (error) throw error

    return `Updated behavior "${existingBehavior.behavior_name}"`
}

async function deleteBehavior(input: ToolInput, userId: string, supabase: any): Promise<string> {
    const { behavior_id } = input

    // Get behavior details first
    const { data: behavior } = await supabase
        .from('behaviors')
        .select('behavior_name')
        .eq('id', behavior_id)
        .eq('user_id', userId)
        .single()

    if (!behavior) {
        return 'Error: Behavior not found'
    }

    const { error } = await supabase
        .from('behaviors')
        .delete()
        .eq('id', behavior_id)

    if (error) throw error

    return `Deleted behavior "${behavior.behavior_name}" and all its check-ins`
}

async function logBehaviorCheckin(input: ToolInput, userId: string, supabase: any): Promise<string> {
    const { behavior_id, date, completed, outcome_notes, reward_score } = input
    const checkinDate = date || getLocalDateString()

    // Get behavior details
    const { data: behavior } = await supabase
        .from('behaviors')
        .select('behavior_name')
        .eq('id', behavior_id)
        .eq('user_id', userId)
        .single()

    if (!behavior) {
        return 'Error: Behavior not found'
    }

    // Upsert check-in (unique on behavior_id + date)
    const { error } = await supabase.from('behavior_checkins').upsert(
        {
            behavior_id,
            user_id: userId,
            date: checkinDate,
            completed,
            outcome_notes: outcome_notes || null,
            reward_score: reward_score || null,
        },
        {
            onConflict: 'behavior_id,date',
        }
    )

    if (error) throw error

    return `Logged check-in for "${behavior.behavior_name}" on ${checkinDate}: ${completed ? 'completed' : 'not completed'}${reward_score ? ` (reward score: ${reward_score}/10)` : ''}`
}

async function setWorkHours(input: ToolInput, userId: string, supabase: any): Promise<string> {
    const { day_of_week, start_time, end_time, is_enabled } = input

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayName = dayNames[day_of_week]

    // Format times
    const formattedStart = start_time.length === 5 ? `${start_time}:00` : start_time
    const formattedEnd = end_time.length === 5 ? `${end_time}:00` : end_time

    // Upsert work hours
    const { error } = await supabase.from('user_work_hours').upsert(
        {
            user_id: userId,
            day_of_week,
            start_time: formattedStart,
            end_time: formattedEnd,
            is_enabled,
        },
        {
            onConflict: 'user_id,day_of_week',
        }
    )

    if (error) throw error

    return is_enabled 
        ? `Set work hours for ${dayName}: ${start_time}-${end_time}`
        : `Disabled work hours for ${dayName}`
}

// ==================== SCHEDULE OPTIMIZATION HANDLERS ====================

async function analyzeSchedule(input: ToolInput, userId: string, supabase: any): Promise<string> {
    const { date } = input
    
    // Get time blocks for the date
    const { data: timeBlocks } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .order('start_time')
    
    if (!timeBlocks || timeBlocks.length === 0) {
        return `No time blocks scheduled for ${date}.`
    }
    
    // Get user profile for peak hours
    const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('peak_hours_start, peak_hours_end')
        .eq('user_id', userId)
        .single()
    
    // Get task reviews to understand energy patterns by task type
    const { data: taskReviews } = await supabase
        .from('task_reviews')
        .select('*, task:tasks(title, tags)')
        .eq('user_id', userId)
        .limit(50)
    
    const { data: projectReviews } = await supabase
        .from('project_reviews')
        .select('*, project:projects(project_name, tags)')
        .eq('user_id', userId)
        .limit(20)
    
    const workPatterns = calculateWorkPatterns(taskReviews || [], projectReviews || [])
    
    // Analyze schedule
    const issues: string[] = []
    let highEnergyCount = 0
    const peakStart = userProfile?.peak_hours_start || '09:00'
    const peakEnd = userProfile?.peak_hours_end || '12:00'
    
    // Check each block
    for (let i = 0; i < timeBlocks.length; i++) {
        const block = timeBlocks[i]
        const blockStart = block.start_time.slice(0, 5)
        
        // Check if it's a high-energy block type
        const isHighEnergy = block.block_type === 'deep_work' || block.block_type === 'meeting'
        
        if (isHighEnergy) {
            highEnergyCount++
            
            // Check if outside peak hours
            if (blockStart < peakStart || blockStart >= peakEnd) {
                issues.push(`⚠️ High-energy block "${block.task_title || block.block_type}" at ${blockStart} is outside peak hours (${peakStart}-${peakEnd})`)
            }
        }
        
        // Check for too many consecutive high-energy blocks
        if (i > 0 && i < timeBlocks.length) {
            const prevBlock = timeBlocks[i - 1]
            const isPrevHighEnergy = prevBlock.block_type === 'deep_work' || prevBlock.block_type === 'meeting'
            
            if (isHighEnergy && isPrevHighEnergy && highEnergyCount >= 3) {
                issues.push(`⚠️ Cognitive overload risk: 3+ consecutive high-energy blocks around ${blockStart}`)
            }
        }
    }
    
    // Calculate optimization score
    const totalBlocks = timeBlocks.length
    const issueCount = issues.length
    const score = Math.max(0, Math.round(100 - (issueCount / totalBlocks) * 50))
    
    let response = `📊 Schedule Analysis for ${date}:\n\n`
    response += `Optimization Score: ${score}%\n`
    response += `Time Blocks: ${totalBlocks}\n\n`
    
    if (issues.length > 0) {
        response += `Issues Found:\n${issues.join('\n')}\n\n`
        response += `Suggestions:\n`
        response += `1. Move high-energy work to peak hours (${peakStart}-${peakEnd})\n`
        response += `2. Add breaks between consecutive intense blocks\n`
        response += `3. Consider rescheduling some blocks for better energy alignment\n`
    } else {
        response += `✅ Schedule looks well-optimized! Good alignment with your peak hours and energy patterns.`
    }
    
    return response
}

async function getTaskInsights(input: ToolInput, userId: string, supabase: any): Promise<string> {
    const { tag_filter, date_range_days = 30 } = input
    
    // Get date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - date_range_days)
    const startDateStr = getLocalDateString(startDate)
    
    // Get task reviews
    let query = supabase
        .from('task_reviews')
        .select('*, task:tasks(title, tags)')
        .eq('user_id', userId)
        .gte('created_at', startDateStr)
    
    const { data: taskReviews } = await query
    
    // Get project reviews
    const { data: projectReviews } = await supabase
        .from('project_reviews')
        .select('*, project:projects(project_name, tags)')
        .eq('user_id', userId)
        .gte('created_at', startDateStr)
    
    const allReviews = [...(taskReviews || []), ...(projectReviews || [])]
    
    if (allReviews.length === 0) {
        return `No reviews found in the last ${date_range_days} days. Complete some tasks/projects and review them to get personalized insights!`
    }
    
    // Filter by tags if provided
    let filteredReviews = allReviews
    if (tag_filter && tag_filter.length > 0) {
        filteredReviews = allReviews.filter(review => {
            const tags = review.task?.tags || review.project?.tags || []
            return tag_filter.some((filterTag: string) => tags.includes(filterTag))
        })
        
        if (filteredReviews.length === 0) {
            return `No reviews found with tags: ${tag_filter.join(', ')}`
        }
    }
    
    // Calculate aggregate stats
    const totalReviews = filteredReviews.length
    const avgEnjoyment = filteredReviews.reduce((sum, r) => sum + (r.enjoyment_rating || 0), 0) / totalReviews
    const avgOverall = filteredReviews.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / totalReviews
    
    // Energy distribution
    const energyCounts = { low: 0, medium: 0, high: 0 }
    filteredReviews.forEach(r => {
        if (r.energy_required) energyCounts[r.energy_required as 'low' | 'medium' | 'high']++
    })
    
    // Difficulty distribution
    const difficultyCounts = { easy: 0, medium: 0, hard: 0 }
    filteredReviews.forEach(r => {
        if (r.difficulty) difficultyCounts[r.difficulty as 'easy' | 'medium' | 'hard']++
    })
    
    // Calculate work patterns
    const workPatterns = calculateWorkPatterns(taskReviews || [], projectReviews || [])
    
    let response = `📈 Work Insights (Last ${date_range_days} days):\n\n`
    
    if (tag_filter && tag_filter.length > 0) {
        response += `Filtered by tags: ${tag_filter.join(', ')}\n\n`
    }
    
    response += `Reviews Analyzed: ${totalReviews}\n`
    response += `Average Enjoyment: ${avgEnjoyment.toFixed(1)}/5 ⭐\n`
    response += `Average Overall Rating: ${avgOverall.toFixed(1)}/5\n\n`
    
    response += `Energy Distribution:\n`
    response += `  • Low: ${energyCounts.low} (${Math.round(energyCounts.low / totalReviews * 100)}%)\n`
    response += `  • Medium: ${energyCounts.medium} (${Math.round(energyCounts.medium / totalReviews * 100)}%)\n`
    response += `  • High: ${energyCounts.high} (${Math.round(energyCounts.high / totalReviews * 100)}%)\n\n`
    
    if (workPatterns.enjoyedTags.length > 0) {
        response += `Most Enjoyed Work: ${workPatterns.enjoyedTags.join(', ')}\n`
    }
    
    if (workPatterns.drainedByTags.length > 0) {
        response += `Draining Work: ${workPatterns.drainedByTags.join(', ')}\n`
    }
    
    response += `\n💡 Recommendations:\n`
    if (workPatterns.highEnergyTags.length > 0) {
        response += `• Schedule these during peak hours: ${workPatterns.highEnergyTags.join(', ')}\n`
    }
    if (workPatterns.enjoyedTags.length > 0 && workPatterns.drainedByTags.length > 0) {
        response += `• Alternate draining tasks with enjoyable ones for better motivation\n`
    }
    response += `• Continue tracking reviews to get more personalized insights!`
    
    return response
}

// Main POST handler
export async function POST(request: NextRequest) {
    console.log('API: Received chat request')
    try {
        const { message, timezone } = await request.json()
        console.log('API: Message received:', message, 'Timezone:', timezone)

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 })
        }

        // Get authenticated user
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            console.log('API: User not authenticated')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.log('API: User authenticated:', user.id)

        // Build context
        console.log('API: Building context...')
        const context = await buildContext(user.id, supabase, timezone)
        console.log('API: Context built')

        const systemPrompt = formatSystemPrompt(context)

        // Build conversation history for context
        const conversationMessages: { role: 'user' | 'assistant'; content: string }[] = []
        
        // Add previous conversations (limited to last 15 exchanges)
        if (context.conversationHistory && context.conversationHistory.length > 0) {
            for (const conv of context.conversationHistory) {
                conversationMessages.push({ role: 'user', content: conv.message })
                conversationMessages.push({ role: 'assistant', content: conv.response })
            }
        }
        
        // Add current message
        conversationMessages.push({ role: 'user', content: message })

        // Call Claude API
        console.log('API: Calling Anthropic with', conversationMessages.length, 'messages in history...')
        if (!process.env.ANTHROPIC_API_KEY) {
            console.error('API: Missing ANTHROPIC_API_KEY')
            throw new Error('Missing ANTHROPIC_API_KEY')
        }

        let response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2000,
            system: systemPrompt,
            messages: conversationMessages,
            tools,
        })
        console.log('API: Anthropic response received')

        const actionsExecuted: ActionExecuted[] = []

        // Handle tool calls
        if (response.stop_reason === 'tool_use') {
            const toolUseBlocks = response.content.filter((block) => block.type === 'tool_use')

            // Execute all tools
            const toolResults = await Promise.all(
                toolUseBlocks.map(async (toolBlock: any) => {
                    const result = await executeToolCall(toolBlock.name, toolBlock.input, user.id, supabase)

                    actionsExecuted.push({
                        tool: toolBlock.name,
                        input: toolBlock.input,
                        result,
                    })

                    return {
                        type: 'tool_result',
                        tool_use_id: toolBlock.id,
                        content: result,
                    }
                })
            )

            // Make second API call with tool results (include full conversation history)
            const messagesWithTools = [
                ...conversationMessages.slice(0, -1), // All previous messages except current
                { role: 'user' as const, content: message },
                { role: 'assistant' as const, content: response.content },
                { role: 'user' as const, content: toolResults },
            ]
            
            response = await anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 2000,
                system: systemPrompt,
                messages: messagesWithTools,
                tools,
            })
        }

        // Extract final text response
        const textBlocks = response.content.filter((block) => block.type === 'text')
        const finalResponse = textBlocks.map((block: any) => block.text).join('\n')

        // Save conversation
        await supabase.from('ai_conversations').insert({
            user_id: user.id,
            message,
            response: finalResponse,
            action_taken: actionsExecuted.length > 0 ? actionsExecuted : null,
        })

        return NextResponse.json({
            message: finalResponse,
            actionsExecuted,
        })
    } catch (error: any) {
        console.error('Claude API error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
