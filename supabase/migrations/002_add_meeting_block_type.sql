-- Add 'meeting' to the block_type enum
-- Migration: 002_add_meeting_block_type.sql

ALTER TYPE block_type ADD VALUE IF NOT EXISTS 'meeting';

