import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
})

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
async function buildContext(userId: string, supabase: any) {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })

    // Get user profile
    const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

    // Get most recent quarterly plan
    const { data: quarterlyPlans } = await supabase
        .from('quarterly_plans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)

    const quarterlyPlan = quarterlyPlans?.[0]

    // Get current week's weekly plan
    const dayOfWeek = now.getDay()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - dayOfWeek)
    const weekStartString = weekStart.toISOString().split('T')[0]

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
        .order('queue_position', { ascending: true})
        .limit(5)

    // Get future time blocks (next 7 days)
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0]

    const { data: futureBlocks } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('user_id', userId)
        .gt('date', today)
        .lte('date', sevenDaysStr)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })

    // Get recent notes (last 30 days) with tags
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

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

    return {
        today,
        currentTime,
        userProfile: userProfile || null,
        quarterlyPlan,
        weeklyPlan,
        timeBlocks: timeBlocks || [],
        futureBlocks: futureBlocks || [],
        activeTasks: activeTasks || [],
        queuedTasks: queuedTasks || [],
        recentNotes: recentNotes || [],
        behaviors: behaviors || [],
        recentCheckins: recentCheckins || [],
        conversationHistory: conversationHistory?.reverse() || [], // Reverse to chronological order
    }
}

// Helper: Format context into system prompt
function formatSystemPrompt(context: any) {
    const { today, currentTime, userProfile, quarterlyPlan, weeklyPlan, timeBlocks, futureBlocks, activeTasks, queuedTasks, recentNotes, behaviors, recentCheckins } = context

    const displayDate = new Date(today).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    })

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

    let prompt = `You are ${aiName}, ${userName}'s personal productivity assistant, focused on deep work and meaningful productivity. When asked your name, say you are ${aiName}.

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
            default:
                return `Unknown tool: ${toolName}`
        }
    } catch (error: any) {
        return `Error executing ${toolName}: ${error.message}`
    }
}

async function createTimeBlock(input: ToolInput, userId: string, supabase: any): Promise<string> {
    const date = input.date || new Date().toISOString().split('T')[0]
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
    const checkinDate = date || new Date().toISOString().split('T')[0]

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

// Main POST handler
export async function POST(request: NextRequest) {
    console.log('API: Received chat request')
    try {
        const { message } = await request.json()
        console.log('API: Message received:', message)

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
        const context = await buildContext(user.id, supabase)
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
