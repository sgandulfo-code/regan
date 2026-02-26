-- FINAL RLS FIX
-- Re-enables security and applies correct policies for both Agents and Clients.

-- 1. Re-enable RLS
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_itineraries ENABLE ROW LEVEL SECURITY;

-- 2. Clear existing policies to avoid conflicts
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

-- 3. FOLDERS POLICIES
CREATE POLICY "Users can manage their own folders" ON folders
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public can view folders via shared itinerary" ON folders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shared_itineraries
      WHERE shared_itineraries.folder_id = folders.id
      AND shared_itineraries.is_active = true
    )
  );

-- 4. PROPERTIES POLICIES
CREATE POLICY "Users can manage their own properties" ON properties
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public can view properties via shared itinerary" ON properties
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shared_itineraries
      WHERE shared_itineraries.folder_id = properties.folder_id
      AND shared_itineraries.is_active = true
    )
  );

-- 5. VISITS POLICIES
CREATE POLICY "Users can manage their own visits" ON visits
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public can view visits via shared itinerary" ON visits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shared_itineraries
      WHERE shared_itineraries.folder_id = visits.folder_id
      AND shared_itineraries.is_active = true
    )
  );

-- Allow public to create visits (requests) if they have access to the folder via shared itinerary
CREATE POLICY "Public can create visits via shared itinerary" ON visits
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM shared_itineraries
      WHERE shared_itineraries.folder_id = visits.folder_id
      AND shared_itineraries.is_active = true
    )
  );

-- Allow public to update visits (e.g. feedback, rating) if they have access
CREATE POLICY "Public can update visits via shared itinerary" ON visits
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM shared_itineraries
      WHERE shared_itineraries.folder_id = visits.folder_id
      AND shared_itineraries.is_active = true
    )
  );

-- 6. SHARED ITINERARIES POLICIES
CREATE POLICY "Owners can manage shared itineraries" ON shared_itineraries
  FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Public can view active shared itineraries" ON shared_itineraries
  FOR SELECT USING (is_active = true);
