-- Migration: Create user_profiles and ai_insights tables
-- Description: Tables for AI personalization and user preferences

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    display_name TEXT,
    
    -- Work Style
    work_style TEXT CHECK (work_style IN ('focused_blocks', 'flexible_sprints', 'task_switching')),
    preferred_work_duration INTEGER DEFAULT 90, -- minutes
    preferred_break_duration INTEGER DEFAULT 15, -- minutes
    
    -- Chronotype
    chronotype TEXT CHECK (chronotype IN ('early_bird', 'night_owl', 'flexible')),
    peak_hours_start TIME DEFAULT '09:00:00',
    peak_hours_end TIME DEFAULT '12:00:00',
    secondary_peak_start TIME,
    secondary_peak_end TIME,
    
    -- Employment
    employment_type TEXT CHECK (employment_type IN ('business_owner', 'employee', 'freelancer', 'student', 'other')),
    has_fixed_schedule BOOLEAN DEFAULT false,
    typical_work_start TIME DEFAULT '09:00:00',
    typical_work_end TIME DEFAULT '17:00:00',
    
    -- Motivations
    motivations TEXT[],
    values TEXT[],
    goals_short_term TEXT,
    goals_long_term TEXT,
    
    -- Life Circumstances
    has_caregiving_responsibilities BOOLEAN DEFAULT false,
    caregiving_notes TEXT,
    external_commitments TEXT,
    
    -- Health
    health_considerations TEXT[],
    accommodation_preferences TEXT,
    
    -- Notifications
    reminder_style TEXT DEFAULT 'gentle' CHECK (reminder_style IN ('gentle', 'assertive', 'minimal', 'none')),
    notification_frequency TEXT DEFAULT 'balanced' CHECK (notification_frequency IN ('frequent', 'balanced', 'minimal')),
    preferred_reminder_times TEXT[],
    
    -- AI Preferences
    ai_name TEXT DEFAULT 'Claude',
    ai_personality TEXT DEFAULT 'supportive' CHECK (ai_personality IN ('supportive', 'direct', 'analytical', 'motivational')),
    wants_accountability BOOLEAN DEFAULT true,
    wants_suggestions BOOLEAN DEFAULT true,
    wants_insights BOOLEAN DEFAULT true,
    
    -- Push Notifications
    push_subscription JSONB,
    notifications_enabled BOOLEAN DEFAULT true,
    notify_before_block INTEGER DEFAULT 5, -- minutes before block to notify
    
    -- Onboarding
    intake_completed BOOLEAN DEFAULT false,
    intake_completed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_insights table
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    insight_type TEXT NOT NULL CHECK (insight_type IN ('pattern', 'blindspot', 'recommendation', 'celebration')),
    category TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    related_data JSONB,
    confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    is_dismissed BOOLEAN DEFAULT false,
    is_acted_upon BOOLEAN DEFAULT false,
    user_feedback TEXT CHECK (user_feedback IN ('helpful', 'not_helpful', 'already_knew')),
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_created_at ON ai_insights(created_at DESC);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotent migrations)
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own insights" ON ai_insights;
DROP POLICY IF EXISTS "Users can insert own insights" ON ai_insights;
DROP POLICY IF EXISTS "Users can update own insights" ON ai_insights;
DROP POLICY IF EXISTS "Users can delete own insights" ON ai_insights;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile"
    ON user_profiles FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for ai_insights
CREATE POLICY "Users can view own insights"
    ON ai_insights FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights"
    ON ai_insights FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insights"
    ON ai_insights FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own insights"
    ON ai_insights FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger to update updated_at on user_profiles
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trigger_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profiles_updated_at();

