-- Migration: Add missing columns to user_profiles
-- Description: Adds columns that were added after initial table creation

-- Add AI name column
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS ai_name TEXT DEFAULT 'Claude';

-- Add AI personality column  
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS ai_personality TEXT DEFAULT 'supportive';
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_ai_personality_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_ai_personality_check 
    CHECK (ai_personality IN ('supportive', 'direct', 'analytical', 'motivational'));

-- Add AI preference columns
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS wants_accountability BOOLEAN DEFAULT true;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS wants_suggestions BOOLEAN DEFAULT true;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS wants_insights BOOLEAN DEFAULT true;

-- Add push notification columns
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS push_subscription JSONB;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS notify_before_block INTEGER DEFAULT 5;

-- Add intake tracking columns
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS intake_completed BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS intake_completed_at TIMESTAMP WITH TIME ZONE;

-- Add work style column if missing
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS work_style TEXT;
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_work_style_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_work_style_check 
    CHECK (work_style IN ('focused_blocks', 'flexible_sprints', 'task_switching'));

-- Add chronotype column if missing
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS chronotype TEXT;
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_chronotype_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_chronotype_check 
    CHECK (chronotype IN ('early_bird', 'night_owl', 'flexible'));

-- Add employment type if missing
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS employment_type TEXT;
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_employment_type_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_employment_type_check 
    CHECK (employment_type IN ('business_owner', 'employee', 'freelancer', 'student', 'other'));

-- Add reminder style if missing
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS reminder_style TEXT DEFAULT 'gentle';
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_reminder_style_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_reminder_style_check 
    CHECK (reminder_style IN ('gentle', 'assertive', 'minimal', 'none'));

-- Add notification frequency if missing
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS notification_frequency TEXT DEFAULT 'balanced';
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_notification_frequency_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_notification_frequency_check 
    CHECK (notification_frequency IN ('frequent', 'balanced', 'minimal'));

-- Add other missing columns
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS preferred_work_duration INTEGER DEFAULT 90;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS preferred_break_duration INTEGER DEFAULT 15;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS peak_hours_start TIME DEFAULT '09:00:00';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS peak_hours_end TIME DEFAULT '12:00:00';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS secondary_peak_start TIME;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS secondary_peak_end TIME;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS has_fixed_schedule BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS typical_work_start TIME DEFAULT '09:00:00';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS typical_work_end TIME DEFAULT '17:00:00';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS motivations TEXT[];
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS values TEXT[];
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS goals_short_term TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS goals_long_term TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS has_caregiving_responsibilities BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS caregiving_notes TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS external_commitments TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS health_considerations TEXT[];
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS accommodation_preferences TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS preferred_reminder_times TEXT[];

-- Update timestamps if missing
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();


