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
    task_id: string | null // Optional reference to active project
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

export interface Note {
    id: string
    user_id: string
    title: string
    content: string
    source_type: string | null
    source_name: string | null
    created_at: string
    updated_at: string
}

export interface NoteTag {
    id: string
    note_id: string
    tag_type: string // 'project', 'concept', 'person', 'custom'
    tag_value: string
    created_at: string
}

export interface ConceptConnection {
    id: string
    user_id: string
    note_id_1: string
    note_id_2: string
    connection_strength: number | null // 0-1
    shared_concepts: string[] | null
    ai_explanation: string | null
    created_at: string
}

export interface Behavior {
    id: string
    user_id: string
    behavior_name: string
    description: string | null
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    is_rewarding: boolean
    category: string | null
    created_at: string
    updated_at: string
}

export interface BehaviorCheckin {
    id: string
    behavior_id: string
    user_id: string
    date: string // YYYY-MM-DD
    completed: boolean
    outcome_notes: string | null
    reward_score: number | null // 1-10
    created_at: string
}

export interface UserWorkHours {
    id: string
    user_id: string
    day_of_week: number // 0 = Sunday, 6 = Saturday
    start_time: string // HH:MM:SS format
    end_time: string // HH:MM:SS format
    is_enabled: boolean
    created_at: string
    updated_at: string
}

// Database table names
export type Tables = {
    time_blocks: TimeBlock
    tasks: Task
    quarterly_plans: QuarterlyPlan
    weekly_plans: WeeklyPlan
    ai_conversations: AIConversation
    notes: Note
    note_tags: NoteTag
    concept_connections: ConceptConnection
    behaviors: Behavior
    behavior_checkins: BehaviorCheckin
    user_work_hours: UserWorkHours
}
