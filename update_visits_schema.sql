-- Add photos and rating columns to visits
ALTER TABLE visits ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';
ALTER TABLE visits ADD COLUMN IF NOT EXISTS rating INTEGER;

-- Allow public to update visits if they are part of an active shared itinerary
DROP POLICY IF EXISTS "Public can update visits via shared itinerary" ON visits;
CREATE POLICY "Public can update visits via shared itinerary" ON visits
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shared_itineraries
      WHERE shared_itineraries.folder_id = visits.folder_id
      AND shared_itineraries.is_active = true
    )
  );

-- Create storage bucket for visit photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('visit-photos', 'visit-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public to upload and view photos in this bucket
DROP POLICY IF EXISTS "Public can upload visit photos" ON storage.objects;
CREATE POLICY "Public can upload visit photos" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'visit-photos');

DROP POLICY IF EXISTS "Public can view visit photos" ON storage.objects;
CREATE POLICY "Public can view visit photos" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'visit-photos');
