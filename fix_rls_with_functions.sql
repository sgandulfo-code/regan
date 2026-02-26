-- FIX RLS WITH SECURITY DEFINER FUNCTIONS
-- This approach avoids RLS recursion and is more reliable.

-- 1. Create a secure function to check sharing status
CREATE OR REPLACE FUNCTION public.is_folder_shared(_folder_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with admin privileges, bypassing RLS for this check
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.shared_itineraries
    WHERE folder_id = _folder_id
    AND is_active = true
  );
END;
$$;

-- 2. Enable RLS on all tables
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_itineraries ENABLE ROW LEVEL SECURITY;

-- 3. Drop ALL existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Auth full access folders" ON folders;
DROP POLICY IF EXISTS "Anon read shared folders" ON folders;
DROP POLICY IF EXISTS "Users can manage their own folders" ON folders;
DROP POLICY IF EXISTS "Public can view folders via shared itinerary" ON folders;

DROP POLICY IF EXISTS "Auth full access properties" ON properties;
DROP POLICY IF EXISTS "Anon read shared properties" ON properties;
DROP POLICY IF EXISTS "Users can manage their own properties" ON properties;
DROP POLICY IF EXISTS "Public can view properties via shared itinerary" ON properties;

DROP POLICY IF EXISTS "Auth full access visits" ON visits;
DROP POLICY IF EXISTS "Anon read shared visits" ON visits;
DROP POLICY IF EXISTS "Anon create shared visits" ON visits;
DROP POLICY IF EXISTS "Anon update shared visits" ON visits;
DROP POLICY IF EXISTS "Users can manage their own visits" ON visits;
DROP POLICY IF EXISTS "Public can view visits via shared itinerary" ON visits;

DROP POLICY IF EXISTS "Auth full access itineraries" ON shared_itineraries;
DROP POLICY IF EXISTS "Anon read active itineraries" ON shared_itineraries;
DROP POLICY IF EXISTS "Owners can manage shared itineraries" ON shared_itineraries;
DROP POLICY IF EXISTS "Public can view active shared itineraries" ON shared_itineraries;

-- 4. Create Policies for AUTHENTICATED Users (Agents) - FULL ACCESS
CREATE POLICY "Agent full access folders" ON folders FOR ALL TO authenticated USING (true);
CREATE POLICY "Agent full access properties" ON properties FOR ALL TO authenticated USING (true);
CREATE POLICY "Agent full access visits" ON visits FOR ALL TO authenticated USING (true);
CREATE POLICY "Agent full access itineraries" ON shared_itineraries FOR ALL TO authenticated USING (true);

-- 5. Create Policies for ANONYMOUS Users (Clients) - READ ONLY via Function
-- Shared Itineraries: Can see active ones
CREATE POLICY "Client read active itineraries" ON shared_itineraries 
FOR SELECT TO anon 
USING (is_active = true);

-- Folders: Can see if shared
CREATE POLICY "Client read shared folders" ON folders 
FOR SELECT TO anon 
USING (is_folder_shared(id));

-- Properties: Can see if folder is shared
CREATE POLICY "Client read shared properties" ON properties 
FOR SELECT TO anon 
USING (is_folder_shared(folder_id));

-- Visits: Can see, create, update if folder is shared
CREATE POLICY "Client read shared visits" ON visits 
FOR SELECT TO anon 
USING (is_folder_shared(folder_id));

CREATE POLICY "Client create shared visits" ON visits 
FOR INSERT TO anon 
WITH CHECK (is_folder_shared(folder_id));

CREATE POLICY "Client update shared visits" ON visits 
FOR UPDATE TO anon 
USING (is_folder_shared(folder_id));
