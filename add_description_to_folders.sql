-- Add description column to folders table
ALTER TABLE folders ADD COLUMN IF NOT EXISTS description TEXT;
