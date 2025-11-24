-- ClicklessAI Productivity System - Initial Schema
-- Migration: 001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE block_type AS ENUM ('deep_work', 'shallow_work', 'break', 'personal');
CREATE TYPE task_status AS ENUM ('backlog', 'active', 'completed', 'archived');

-- =====================================================
-- QUARTERLY PLANS TABLE
-- =====================================================
CREATE TABLE quarterly_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quarter TEXT NOT NULL,
  objectives JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user queries
CREATE INDEX idx_quarterly_plans_user_id ON quarterly_plans(user_id);
CREATE INDEX idx_quarterly_plans_quarter ON quarterly_plans(user_id, quarter);

-- Enable RLS
ALTER TABLE quarterly_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own quarterly plans"
  ON quarterly_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quarterly plans"
  ON quarterly_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quarterly plans"
  ON quarterly_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quarterly plans"
  ON quarterly_plans FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- WEEKLY PLANS TABLE
-- =====================================================
CREATE TABLE weekly_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  plan_text TEXT NOT NULL,
  quarterly_plan_id UUID REFERENCES quarterly_plans(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user queries
CREATE INDEX idx_weekly_plans_user_id ON weekly_plans(user_id);
CREATE INDEX idx_weekly_plans_week ON weekly_plans(user_id, week_start);

-- Enable RLS
ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own weekly plans"
  ON weekly_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weekly plans"
  ON weekly_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly plans"
  ON weekly_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weekly plans"
  ON weekly_plans FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TIME BLOCKS TABLE
-- =====================================================
CREATE TABLE time_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  block_type block_type NOT NULL,
  task_title TEXT,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_time_blocks_user_id ON time_blocks(user_id);
CREATE INDEX idx_time_blocks_user_date ON time_blocks(user_id, date);
CREATE INDEX idx_time_blocks_date ON time_blocks(date);

-- Enable RLS
ALTER TABLE time_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own time blocks"
  ON time_blocks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own time blocks"
  ON time_blocks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own time blocks"
  ON time_blocks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own time blocks"
  ON time_blocks FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TASKS TABLE
-- =====================================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status task_status NOT NULL DEFAULT 'backlog',
  queue_position INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_queue_position ON tasks(queue_position) WHERE queue_position IS NOT NULL;

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- AI CONVERSATIONS TABLE
-- =====================================================
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  action_taken JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user queries
CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_created_at ON ai_conversations(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own AI conversations"
  ON ai_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI conversations"
  ON ai_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI conversations"
  ON ai_conversations FOR DELETE
  USING (auth.uid() = user_id);
