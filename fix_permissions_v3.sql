-- REPAIR PERMISSIONS V3
-- Run all lines below

-- 1. Reset RLS
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_itineraries ENABLE ROW LEVEL SECURITY;

-- 2. Drop old policies
DROP POLICY IF EXISTS "Auth full access folders" ON folders;
DROP POLICY IF EXISTS "Anon read shared folders" ON folders;
DROP POLICY IF EXISTS "Auth full access properties" ON properties;
DROP POLICY IF EXISTS "Anon read shared properties" ON properties;
DROP POLICY IF EXISTS "Auth full access visits" ON visits;
DROP POLICY IF EXISTS "Anon read shared visits" ON visits;
DROP POLICY IF EXISTS "Anon create shared visits" ON visits;
DROP POLICY IF EXISTS "Anon update shared visits" ON visits;
DROP POLICY IF EXISTS "Auth full access itineraries" ON shared_itineraries;
DROP POLICY IF EXISTS "Anon read active itineraries" ON shared_itineraries;

-- 3. Create new policies

-- Folders
CREATE POLICY "Auth full access folders" ON folders FOR ALL TO authenticated USING (true);
CREATE POLICY "Anon read shared folders" ON folders FOR SELECT TO anon USING (
  EXISTS (
    SELECT 1 FROM shared_itineraries 
    WHERE shared_itineraries.folder_id = folders.id 
    AND shared_itineraries.is_active = true
  )
);

-- Properties
CREATE POLICY "Auth full access properties" ON properties FOR ALL TO authenticated USING (true);
CREATE POLICY "Anon read shared properties" ON properties FOR SELECT TO anon USING (
  EXISTS (
    SELECT 1 FROM shared_itineraries 
    WHERE shared_itineraries.folder_id = properties.folder_id 
    AND shared_itineraries.is_active = true
  )
);

-- Visits
CREATE POLICY "Auth full access visits" ON visits FOR ALL TO authenticated USING (true);
CREATE POLICY "Anon read shared visits" ON visits FOR SELECT TO anon USING (
  EXISTS (
    SELECT 1 FROM shared_itineraries 
    WHERE shared_itineraries.folder_id = visits.folder_id 
    AND shared_itineraries.is_active = true
  )
);
CREATE POLICY "Anon create shared visits" ON visits FOR INSERT TO anon WITH CHECK (
  EXISTS (
    SELECT 1 FROM shared_itineraries 
    WHERE shared_itineraries.folder_id = visits.folder_id 
    AND shared_itineraries.is_active = true
  )
);
CREATE POLICY "Anon update shared visits" ON visits FOR UPDATE TO anon USING (
  EXISTS (
    SELECT 1 FROM shared_itineraries 
    WHERE shared_itineraries.folder_id = visits.folder_id 
    AND shared_itineraries.is_active = true
  )
);

-- Itineraries
CREATE POLICY "Auth full access itineraries" ON shared_itineraries FOR ALL TO authenticated USING (true);
CREATE POLICY "Anon read active itineraries" ON shared_itineraries FOR SELECT TO anon USING (is_active = true);
