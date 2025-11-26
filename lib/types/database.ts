// Database type definitions for ClicklessAI Productivity System

export type BlockType = 'deep_work' | 'shallow_work' | 'break' | 'personal' | 'meeting'

export type TaskStatus = 'backlog' | 'active' | 'completed' | 'archived'

export type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'archived'

export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export interface Project {
    id: string
    user_id: string
    project_name: string
    description: string | null
    status: ProjectStatus
    priority: Priority
    start_date: string | null // YYYY-MM-DD
    target_completion_date: string | null // YYYY-MM-DD
    actual_completion_date: string | null // YYYY-MM-DD
    quarterly_plan_id: string | null
    weekly_plan_id: string | null
    progress_percentage: number
    tags: string[] | null
    notes: string | null
    created_at: string
    updated_at: string
}

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
    project_id: string | null
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

export interface UserProfile {
    id: string
    user_id: string
    display_name: string | null
    
    // Work Style
    work_style: 'focused_blocks' | 'flexible_sprints' | 'task_switching' | null
    preferred_work_duration: number
    preferred_break_duration: number
    
    // Chronotype
    chronotype: 'early_bird' | 'night_owl' | 'flexible' | null
    peak_hours_start: string
    peak_hours_end: string
    secondary_peak_start: string | null
    secondary_peak_end: string | null
    
    // Employment
    employment_type: 'business_owner' | 'employee' | 'freelancer' | 'student' | 'other' | null
    has_fixed_schedule: boolean
    typical_work_start: string
    typical_work_end: string
    
    // Motivations
    motivations: string[] | null
    values: string[] | null
    goals_short_term: string | null
    goals_long_term: string | null
    
    // Life Circumstances
    has_caregiving_responsibilities: boolean
    caregiving_notes: string | null
    external_commitments: string | null
    
    // Health
    health_considerations: string[] | null
    accommodation_preferences: string | null
    
    // Notifications
    reminder_style: 'gentle' | 'assertive' | 'minimal' | 'none'
    notification_frequency: 'frequent' | 'balanced' | 'minimal'
    preferred_reminder_times: string[] | null
    
    // AI Preferences
    ai_name: string
    ai_personality: 'supportive' | 'direct' | 'analytical' | 'motivational'
    wants_accountability: boolean
    wants_suggestions: boolean
    wants_insights: boolean
    
    // Push Notifications
    push_subscription: any | null
    notifications_enabled: boolean
    notify_before_block: number
    
    // Onboarding
    intake_completed: boolean
    intake_completed_at: string | null
    
    created_at: string
    updated_at: string
}

export interface AIInsight {
    id: string
    user_id: string
    insight_type: 'pattern' | 'blindspot' | 'recommendation' | 'celebration'
    category: string | null
    title: string
    content: string
    related_data: Record<string, any> | null
    confidence_score: number | null
    is_dismissed: boolean
    is_acted_upon: boolean
    user_feedback: 'helpful' | 'not_helpful' | 'already_knew' | null
    valid_until: string | null
    created_at: string
}

// Database table names
export type Tables = {
    time_blocks: TimeBlock
    tasks: Task
    projects: Project
    quarterly_plans: QuarterlyPlan
    weekly_plans: WeeklyPlan
    ai_conversations: AIConversation
    notes: Note
    note_tags: NoteTag
    concept_connections: ConceptConnection
    behaviors: Behavior
    behavior_checkins: BehaviorCheckin
    user_work_hours: UserWorkHours
    user_profiles: UserProfile
    ai_insights: AIInsight
}
