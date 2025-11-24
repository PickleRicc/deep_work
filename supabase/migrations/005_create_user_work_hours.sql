-- Create User Work Hours Table
-- Migration: 005_create_user_work_hours.sql

-- User work hours (per day of week)
CREATE TABLE user_work_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL, -- e.g., '09:00:00'
  end_time TIME NOT NULL, -- e.g., '17:00:00'
  is_enabled BOOLEAN NOT NULL DEFAULT true, -- Allow disabling work on certain days
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, day_of_week)
);

-- Index for fast user lookups
CREATE INDEX idx_user_work_hours_user_id ON user_work_hours(user_id);

-- RLS Policies
ALTER TABLE user_work_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own work hours"
  ON user_work_hours FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own work hours"
  ON user_work_hours FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own work hours"
  ON user_work_hours FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own work hours"
  ON user_work_hours FOR DELETE
  USING (auth.uid() = user_id);

-- Insert default work hours (9am-5pm, Monday-Friday) for all existing users
INSERT INTO user_work_hours (user_id, day_of_week, start_time, end_time, is_enabled)
SELECT 
  id as user_id,
  day_of_week,
  '09:00:00'::TIME as start_time,
  '17:00:00'::TIME as end_time,
  CASE 
    WHEN day_of_week >= 1 AND day_of_week <= 5 THEN true -- Monday-Friday enabled
    ELSE false -- Saturday-Sunday disabled
  END as is_enabled
FROM 
  auth.users,
  generate_series(0, 6) as day_of_week
ON CONFLICT (user_id, day_of_week) DO NOTHING;

