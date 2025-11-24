// Database type definitions for ClicklessAI Productivity System

export type BlockType = 'deep_work' | 'shallow_work' | 'break' | 'personal' | 'meeting'

export type TaskStatus = 'backlog' | 'active' | 'completed' | 'archived'

export interface TimeBlock {
    id: string
    user_id: string
    date: string // YYYY-MM-DD format
    start_time: string // HH:MM format
    end_time: string // HH:MM format
    block_type: BlockType
    task_title: string | null
    completed: boolean
    created_at: string
}

export interface Task {
    id: string
    user_id: string
    title: string
    status: TaskStatus
    queue_position: number | null
    notes: string | null
    created_at: string
    completed_at: string | null
}

export interface QuarterlyPlan {
    id: string
    user_id: string
    quarter: string // e.g., "2024-Q1"
    objectives: string[] // Array of objective strings
    created_at: string
}

export interface WeeklyPlan {
    id: string
    user_id: string
    week_start: string // YYYY-MM-DD format (Monday)
    plan_text: string
    quarterly_plan_id: string | null
    created_at: string
}

export interface AIConversation {
    id: string
    user_id: string
    message: string
    response: string
    action_taken: Record<string, any> | null // JSONB field for tracking actions
    created_at: string
}

// Database table names
export type Tables = {
    time_blocks: TimeBlock
    tasks: Task
    quarterly_plans: QuarterlyPlan
    weekly_plans: WeeklyPlan
    ai_conversations: AIConversation
}
