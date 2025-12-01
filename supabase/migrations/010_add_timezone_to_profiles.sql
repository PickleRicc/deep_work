-- Migration: Add timezone to user_profiles
-- Description: Store user's timezone for consistent date calculations across server/client

-- Add timezone column to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';

-- Comment for documentation
COMMENT ON COLUMN user_profiles.timezone IS 'IANA timezone identifier (e.g., America/New_York, Europe/London, Asia/Tokyo)';

