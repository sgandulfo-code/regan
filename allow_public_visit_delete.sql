-- Permitir a usuarios anónimos ELIMINAR visitas si pertenecen a un itinerario compartido activo
-- Esto es necesario para que los clientes puedan cancelar sus solicitudes de visita

DROP POLICY IF EXISTS "Public can delete visits via shared itinerary" ON visits;

CREATE POLICY "Public can delete visits via shared itinerary" ON visits
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shared_itineraries
      WHERE shared_itineraries.folder_id = visits.folder_id
      AND shared_itineraries.is_active = true
    )
  );
