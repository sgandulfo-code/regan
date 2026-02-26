-- DEBUG: TEMPORARILY DISABLE RLS
-- Run this to confirm if the issue is RLS-related.
-- If data appears after running this, we know the policies are the problem.

ALTER TABLE folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE shared_itineraries DISABLE ROW LEVEL SECURITY;
