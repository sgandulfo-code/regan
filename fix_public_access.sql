-- CORRECCIÓN DE PERMISOS DE LECTURA PÚBLICA
-- Necesario para que el cliente pueda VER las visitas y propiedades sin loguearse

-- 1. Permitir a usuarios anónimos VER las visitas de itinerarios compartidos activos
DROP POLICY IF EXISTS "Public can view visits via shared itinerary" ON visits;
CREATE POLICY "Public can view visits via shared itinerary" ON visits
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shared_itineraries
      WHERE shared_itineraries.folder_id = visits.folder_id
      AND shared_itineraries.is_active = true
    )
  );

-- 2. Permitir a usuarios anónimos VER las propiedades asociadas a esas visitas
-- (Asumiendo que la tabla properties tiene RLS activado)
DROP POLICY IF EXISTS "Public can view properties via shared itinerary" ON properties;
CREATE POLICY "Public can view properties via shared itinerary" ON properties
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM visits
      JOIN shared_itineraries ON shared_itineraries.folder_id = visits.folder_id
      WHERE visits.property_id = properties.id
      AND shared_itineraries.is_active = true
    )
  );
