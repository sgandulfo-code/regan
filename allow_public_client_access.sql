-- Allow public to view client via shared itinerary
DROP POLICY IF EXISTS "Public can view clients via shared itinerary" ON clients;

CREATE POLICY "Public can view clients via shared itinerary" ON clients
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM folders
      JOIN shared_itineraries ON shared_itineraries.folder_id = folders.id
      WHERE folders.client_id = clients.id
      AND shared_itineraries.is_active = true
    )
  );
