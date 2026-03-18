-- Add google_auth column to profiles table for storing OAuth tokens
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_auth JSONB;
