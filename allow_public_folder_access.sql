-- Allow public access to folders that have an active shared itinerary
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

-- Update properties policy to allow viewing ALL properties in a shared folder
-- (Not just ones with visits)
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
