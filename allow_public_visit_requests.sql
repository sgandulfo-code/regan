-- Permitir a usuarios anónimos CREAR visitas si pertenecen a un itinerario compartido activo
-- Esto es necesario para que los clientes puedan solicitar visitas desde el portal público

DROP POLICY IF EXISTS "Public can create visits via shared itinerary" ON visits;

CREATE POLICY "Public can create visits via shared itinerary" ON visits
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shared_itineraries
      WHERE shared_itineraries.folder_id = visits.folder_id
      AND shared_itineraries.is_active = true
    )
  );
