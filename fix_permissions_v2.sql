-- FIX PERMISSIONS V2
-- Run this entire script in the Supabase SQL Editor.

-- 1. Enable RLS
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_itineraries ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL potential conflicting policies
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
DROP POLICY IF EXISTS "Auth full access itineraries" ON shared_itineraries;
DROP POLICY IF EXISTS "Anon read active itineraries" ON shared_itineraries;
DROP POLICY IF EXISTS "Auth full access folders" ON folders;
DROP POLICY IF EXISTS "Anon read shared folders" ON folders;
DROP POLICY IF EXISTS "Auth full access properties" ON properties;
DROP POLICY IF EXISTS "Anon read shared properties" ON properties;
DROP POLICY IF EXISTS "Auth full access visits" ON visits;
DROP POLICY IF EXISTS "Anon read shared visits" ON visits;
DROP POLICY IF EXISTS "Anon create shared visits" ON visits;
DROP POLICY IF EXISTS "Anon update shared visits" ON visits;

-- 3. Create New Policies

-- Shared Itineraries
CREATE POLICY "Auth full access itineraries" ON shared_itineraries FOR ALL TO authenticated USING (true);
CREATE POLICY "Anon read active itineraries" ON shared_itineraries FOR SELECT TO anon USING (is_active = true);

-- Folders
CREATE POLICY "Auth full access folders" ON folders FOR ALL TO authenticated USING (true);
CREATE POLICY "Anon read shared folders" ON folders FOR SELECT TO anon USING (EXISTS (SELECT 1 FROM shared_itineraries WHERE shared_itineraries.folder_id = folders.id AND shared_itineraries.is_active = true));

-- Properties
CREATE POLICY "Auth full access properties" ON properties FOR ALL TO authenticated USING (true);
CREATE POLICY "Anon read shared properties" ON properties FOR SELECT TO anon USING (EXISTS (SELECT 1 FROM shared_itineraries WHERE shared_itineraries.folder_id = properties.folder_id AND shared_itineraries.is_active = true));

-- Visits
CREATE POLICY "Auth full access visits" ON visits FOR ALL TO authenticated USING (true);
CREATE POLICY "Anon read shared visits" ON visits FOR SELECT TO anon USING (EXISTS (SELECT 1 FROM shared_itineraries WHERE shared_itineraries.folder_id = visits.folder_id AND shared_itineraries.is_active = true));
CREATE POLICY "Anon create shared visits" ON visits FOR INSERT TO anon WITH CHECK (EXISTS (SELECT 1 FROM shared_itineraries WHERE shared_itineraries.folder_id = visits.folder_id AND shared_itineraries.is_active = true));
CREATE POLICY "Anon update shared visits" ON visits FOR UPDATE TO anon USING (EXISTS (SELECT 1 FROM shared_itineraries WHERE shared_itineraries.folder_id = visits.folder_id AND shared_itineraries.is_active = true));
