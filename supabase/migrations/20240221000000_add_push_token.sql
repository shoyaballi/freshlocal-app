-- Add push token fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS push_token TEXT,
ADD COLUMN IF NOT EXISTS push_token_updated_at TIMESTAMPTZ;

-- Create index for push token lookups
CREATE INDEX IF NOT EXISTS idx_profiles_push_token
ON profiles(push_token) WHERE push_token IS NOT NULL;
