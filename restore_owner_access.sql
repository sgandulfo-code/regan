-- RESTORE OWNER ACCESS
-- This script ensures that the logged-in user (Agent) can see and manage their own data.
-- Run this in Supabase SQL Editor.

-- 1. Enable RLS (in case it was disabled, though usually we want it enabled)
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- 2. Owner Access for Folders
-- Allow users to do EVERYTHING (Select, Insert, Update, Delete) on their own folders
DROP POLICY IF EXISTS "Users can manage their own folders" ON folders;
CREATE POLICY "Users can manage their own folders" ON folders
  FOR ALL
  USING (auth.uid() = user_id);

-- 3. Owner Access for Properties
-- Allow users to do EVERYTHING on their own properties
DROP POLICY IF EXISTS "Users can manage their own properties" ON properties;
CREATE POLICY "Users can manage their own properties" ON properties
  FOR ALL
  USING (auth.uid() = user_id);

-- 4. Owner Access for Visits
-- Allow users to do EVERYTHING on their own visits
DROP POLICY IF EXISTS "Users can manage their own visits" ON visits;
CREATE POLICY "Users can manage their own visits" ON visits
  FOR ALL
  USING (auth.uid() = user_id);

-- 5. Ensure Public Access still works (Re-applying just in case)
DROP POLICY IF EXISTS "Public can view folders via shared itinerary" ON folders;
CREATE POLICY "Public can view folders via shared itinerary" ON folders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shared_itineraries
      WHERE shared_itineraries.folder_id = folders.id
      AND shared_itineraries.is_active = true
    )
  );

DROP POLICY IF EXISTS "Public can view properties via shared itinerary" ON properties;
CREATE POLICY "Public can view properties via shared itinerary" ON properties
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shared_itineraries
      WHERE shared_itineraries.folder_id = properties.folder_id
      AND shared_itineraries.is_active = true
    )
  );
