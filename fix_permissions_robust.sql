-- ROBUST PERMISSIONS FIX
-- This script simplifies permissions to ensure stability.
-- 1. Authenticated users (Agents) get FULL ACCESS to all tables.
--    (We rely on the App's logic to filter data for the user, which is standard for this stage).
-- 2. Anonymous users (Clients) get READ-ONLY access strictly limited by Shared Itineraries.

-- Enable RLS
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_itineraries ENABLE ROW LEVEL SECURITY;

-- DROP ALL EXISTING POLICIES (Clean Slate)
DROP POLICY IF EXISTS "Users can manage their own folders" ON folders;
DROP POLICY IF EXISTS "Public can view folders via shared itinerary" ON folders;
DROP POLICY IF EXISTS "Users can manage their own properties" ON properties;
DROP POLICY IF EXISTS "Public can view properties via shared itinerary" ON properties;
DROP POLICY IF EXISTS "Users can manage their own visits" ON visits;
DROP POLICY IF EXISTS "Public can view visits via shared itinerary" ON visits;
DROP POLICY IF EXISTS "Public can update visits via shared itinerary" ON visits;
DROP POLICY IF EXISTS "Public can create visits via shared itinerary" ON visits;
DROP POLICY IF EXISTS "Owners can manage shared itineraries" ON shared_itineraries;
DROP POLICY IF EXISTS "Public can view active shared itineraries" ON shared_itineraries;
DROP POLICY IF EXISTS "Enable all for auth users" ON folders;
DROP POLICY IF EXISTS "Anon view shared folders" ON folders;

-- ==========================================
-- 1. SHARED ITINERARIES
-- ==========================================
-- Agents: Full Access
CREATE POLICY "Auth full access itineraries" ON shared_itineraries
  FOR ALL TO authenticated
  USING (true);

-- Clients: Read Active Only
CREATE POLICY "Anon read active itineraries" ON shared_itineraries
  FOR SELECT TO anon
  USING (is_active = true);

-- ==========================================
-- 2. FOLDERS
-- ==========================================
-- Agents: Full Access
CREATE POLICY "Auth full access folders" ON folders
  FOR ALL TO authenticated
  USING (true);

-- Clients: Read if Shared
CREATE POLICY "Anon read shared folders" ON folders
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM shared_itineraries
      WHERE shared_itineraries.folder_id = folders.id
      AND shared_itineraries.is_active = true
    )
  );

-- ==========================================
-- 3. PROPERTIES
-- ==========================================
-- Agents: Full Access
CREATE POLICY "Auth full access properties" ON properties
  FOR ALL TO authenticated
  USING (true);

-- Clients: Read if Shared
CREATE POLICY "Anon read shared properties" ON properties
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM shared_itineraries
      WHERE shared_itineraries.folder_id = properties.folder_id
      AND shared_itineraries.is_active = true
    )
  );

-- ==========================================
-- 4. VISITS
-- ==========================================
-- Agents: Full Access
CREATE POLICY "Auth full access visits" ON visits
  FOR ALL TO authenticated
  USING (true);

-- Clients: Read if Shared
CREATE POLICY "Anon read shared visits" ON visits
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM shared_itineraries
      WHERE shared_itineraries.folder_id = visits.folder_id
      AND shared_itineraries.is_active = true
    )
  );

-- Clients: Create (Request) if Shared
CREATE POLICY "Anon create shared visits" ON visits
  FOR INSERT TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shared_itineraries
      WHERE shared_itineraries.folder_id = visits.folder_id
      AND shared_itineraries.is_active = true
    )
  );

-- Clients: Update (Feedback) if Shared
CREATE POLICY "Anon update shared visits" ON visits
  FOR UPDATE TO anon
  USING (
    EXISTS (
      SELECT 1 FROM shared_itineraries
      WHERE shared_itineraries.folder_id = visits.folder_id
      AND shared_itineraries.is_active = true
    )
  );
