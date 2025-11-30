-- Review and Tagging System Migration
-- Creates tables for task/project reviews, work tags, and updates existing schemas

-- Create helper function for updating updated_at timestamp (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- WORK TAGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS work_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_name TEXT UNIQUE NOT NULL,
    tag_category TEXT, -- 'work_type', 'energy_level', 'enjoyment', etc.
    color_hex TEXT,
    icon_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial tags
INSERT INTO work_tags (tag_name, tag_category, color_hex, icon_name) VALUES
    ('Busy Work', 'work_type', '#6B7280', 'briefcase'),
    ('Creative Work', 'work_type', '#8B5CF6', 'palette'),
    ('Education', 'work_type', '#3B82F6', 'book-open'),
    ('Required Work', 'work_type', '#EF4444', 'alert-circle'),
    ('Fun', 'enjoyment', '#10B981', 'smile'),
    ('Boring', 'enjoyment', '#78716C', 'frown'),
    ('Admin', 'work_type', '#F59E0B', 'folder'),
    ('Strategic', 'work_type', '#EC4899', 'target'),
    ('Communication', 'work_type', '#06B6D4', 'message-circle'),
    ('Problem Solving', 'work_type', '#8B5CF6', 'lightbulb'),
    ('Bug Fixes', 'work_type', '#DC2626', 'bug'),
    ('Documentation', 'work_type', '#0EA5E9', 'file-text'),
    ('Meetings', 'work_type', '#F97316', 'users'),
    ('Research', 'work_type', '#6366F1', 'search')
ON CONFLICT (tag_name) DO NOTHING;

-- Index for tag lookups
CREATE INDEX IF NOT EXISTS idx_work_tags_category ON work_tags(tag_category);

-- Enable RLS
ALTER TABLE work_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for work_tags (read-only for all authenticated users)
DROP POLICY IF EXISTS "Anyone can view work tags" ON work_tags;
CREATE POLICY "Anyone can view work tags"
    ON work_tags FOR SELECT
    TO authenticated
    USING (true);

-- =====================================================
-- TASK REVIEWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS task_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    enjoyment_rating INTEGER CHECK (enjoyment_rating >= 1 AND enjoyment_rating <= 5),
    value_impact TEXT CHECK (value_impact IN ('low', 'medium', 'high')),
    energy_required TEXT CHECK (energy_required IN ('low', 'medium', 'high')),
    what_made_hard TEXT,
    what_was_fun TEXT,
    concepts_disliked TEXT,
    would_do_again BOOLEAN,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for task reviews
CREATE INDEX IF NOT EXISTS idx_task_reviews_user_id ON task_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_task_reviews_task_id ON task_reviews(task_id);
CREATE INDEX IF NOT EXISTS idx_task_reviews_created_at ON task_reviews(created_at DESC);

-- Enable RLS
ALTER TABLE task_reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own task reviews" ON task_reviews;
DROP POLICY IF EXISTS "Users can create own task reviews" ON task_reviews;
DROP POLICY IF EXISTS "Users can update own task reviews" ON task_reviews;
DROP POLICY IF EXISTS "Users can delete own task reviews" ON task_reviews;

-- RLS Policies for task reviews
CREATE POLICY "Users can view own task reviews"
    ON task_reviews FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own task reviews"
    ON task_reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own task reviews"
    ON task_reviews FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own task reviews"
    ON task_reviews FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- PROJECT REVIEWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS project_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    enjoyment_rating INTEGER CHECK (enjoyment_rating >= 1 AND enjoyment_rating <= 5),
    value_impact TEXT CHECK (value_impact IN ('low', 'medium', 'high')),
    energy_required TEXT CHECK (energy_required IN ('low', 'medium', 'high')),
    what_made_hard TEXT,
    what_was_fun TEXT,
    concepts_disliked TEXT,
    would_do_again BOOLEAN,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for project reviews
CREATE INDEX IF NOT EXISTS idx_project_reviews_user_id ON project_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_project_reviews_project_id ON project_reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_project_reviews_created_at ON project_reviews(created_at DESC);

-- Enable RLS
ALTER TABLE project_reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own project reviews" ON project_reviews;
DROP POLICY IF EXISTS "Users can create own project reviews" ON project_reviews;
DROP POLICY IF EXISTS "Users can update own project reviews" ON project_reviews;
DROP POLICY IF EXISTS "Users can delete own project reviews" ON project_reviews;

-- RLS Policies for project reviews
CREATE POLICY "Users can view own project reviews"
    ON project_reviews FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own project reviews"
    ON project_reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project reviews"
    ON project_reviews FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own project reviews"
    ON project_reviews FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- UPDATE EXISTING TABLES
-- =====================================================

-- Add tags column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Add project_id column to time_blocks table
ALTER TABLE time_blocks ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Create index for time_blocks project_id
CREATE INDEX IF NOT EXISTS idx_time_blocks_project_id ON time_blocks(project_id);

-- Create index for tasks tags (GIN index for array columns)
CREATE INDEX IF NOT EXISTS idx_tasks_tags ON tasks USING GIN(tags);

