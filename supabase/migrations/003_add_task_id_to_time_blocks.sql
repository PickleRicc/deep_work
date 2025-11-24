-- Add task_id to time_blocks table to link time blocks with active projects
-- Migration: 003_add_task_id_to_time_blocks.sql

-- Add task_id column with foreign key reference
ALTER TABLE time_blocks
ADD COLUMN task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_time_blocks_task_id ON time_blocks(task_id);

-- Add comment for documentation
COMMENT ON COLUMN time_blocks.task_id IS 'Optional reference to an active project/task';

