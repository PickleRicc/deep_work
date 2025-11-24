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
        .order('queue_position', { ascending: true })
        .limit(5)

    return {
        today,
        currentTime,
        quarterlyPlan,
        weeklyPlan,
        timeBlocks: timeBlocks || [],
        activeTasks: activeTasks || [],
        queuedTasks: queuedTasks || [],
    }
}

// Helper: Format context into system prompt
function formatSystemPrompt(context: any) {
    const { today, currentTime, quarterlyPlan, weeklyPlan, timeBlocks, activeTasks, queuedTasks } = context

    const displayDate = new Date(today).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    })

    let prompt = `You are a productivity assistant for Eric's Cal Newport-based system.

CURRENT DATE/TIME: ${displayDate} ${currentTime}

QUARTERLY OBJECTIVES:
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

    prompt += `
RULES:
1. Maximum 3 active tasks - enforce strictly
2. Time blocks cannot overlap
3. Reference quarterly goals when planning
4. Be concise and direct
5. Confirm actions taken`

    return prompt
}

// Tool definitions
const tools: Anthropic.Tool[] = [
    {
        name: 'create_time_block',
        description: 'Create a new time block in the schedule. Validates no overlaps exist.',
        input_schema: {
            type: 'object',
            properties: {
                date: {
                    type: 'string',
                    description: 'Date in YYYY-MM-DD format. Defaults to today if not provided.',
                },
                start_time: {
                    type: 'string',
                    description: 'Start time in HH:MM format (24-hour)',
                },
                end_time: {
                    type: 'string',
                    description: 'End time in HH:MM format (24-hour)',
                },
                block_type: {
                    type: 'string',
                    enum: ['deep_work', 'shallow_work', 'break', 'personal'],
                    description: 'Type of time block',
                },
                task_title: {
                    type: 'string',
                    description: 'Optional title/description for the block',
                },
            },
            required: ['start_time', 'end_time', 'block_type'],
        },
    },
    {
        name: 'add_task',
        description: 'Add a new task to the queue',
        input_schema: {
            type: 'object',
            properties: {
                title: {
                    type: 'string',
                    description: 'Task title',
                },
                notes: {
                    type: 'string',
                    description: 'Optional notes about the task',
                },
            },
            required: ['title'],
        },
    },
    {
        name: 'pull_task',
        description: 'Pull a task from queue to active status. Checks 3-task limit.',
        input_schema: {
            type: 'object',
            properties: {
                task_id: {
                    type: 'string',
                    description: 'ID of the task to pull',
                },
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
                task_id: {
                    type: 'string',
                    description: 'ID of the task to complete',
                },
            },
            required: ['task_id'],
        },
    },
    {
        name: 'update_weekly_plan',
        description: 'Create or update the weekly plan for the current week',
        input_schema: {
            type: 'object',
            properties: {
                plan_text: {
                    type: 'string',
                    description: 'The weekly plan text',
                },
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
                quarter: {
                    type: 'string',
                    description: 'Quarter identifier (e.g., "2024-Q4")',
                },
                objectives: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of objective strings',
                },
            },
            required: ['quarter', 'objectives'],
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
            case 'create_time_block':
                return await createTimeBlock(toolInput, userId, supabase)
            case 'add_task':
                return await addTask(toolInput, userId, supabase)
            case 'pull_task':
                return await pullTask(toolInput, userId, supabase)
            case 'complete_task':
                return await completeTask(toolInput, userId, supabase)
            case 'update_weekly_plan':
                return await updateWeeklyPlan(toolInput, userId, supabase)
            case 'update_quarterly_plan':
                return await updateQuarterlyPlan(toolInput, userId, supabase)
            default:
                return `Unknown tool: ${toolName}`
        }
    } catch (error: any) {
        return `Error executing ${toolName}: ${error.message}`
    }
}

async function createTimeBlock(input: ToolInput, userId: string, supabase: any): Promise<string> {
    const date = input.date || new Date().toISOString().split('T')[0]
    const { start_time, end_time, block_type, task_title } = input

    // Check for overlaps
    const { data: existingBlocks } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)

    if (existingBlocks && existingBlocks.length > 0) {
        for (const block of existingBlocks) {
            if (
                (start_time >= block.start_time && start_time < block.end_time) ||
                (end_time > block.start_time && end_time <= block.end_time) ||
                (start_time <= block.start_time && end_time >= block.end_time)
            ) {
                return `Error: Time block overlaps with existing block ${block.start_time}-${block.end_time}`
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

    return `Created ${block_type} block from ${start_time} to ${end_time}${task_title ? ` for "${task_title}"` : ''}`
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

        // Call Claude API
        console.log('API: Calling Anthropic...')
        if (!process.env.ANTHROPIC_API_KEY) {
            console.error('API: Missing ANTHROPIC_API_KEY')
            throw new Error('Missing ANTHROPIC_API_KEY')
        }

        let response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2000,
            system: systemPrompt,
            messages: [{ role: 'user', content: message }],
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

            // Make second API call with tool results
            response = await anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 2000,
                system: systemPrompt,
                messages: [
                    { role: 'user', content: message },
                    { role: 'assistant', content: response.content },
                    { role: 'user', content: toolResults },
                ],
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
