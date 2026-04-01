-- PASO 1: Ejecutar este bloque PRIMERO y esperar a que termine (Commit)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_status') THEN
    EXECUTE 'ALTER TYPE property_status ADD VALUE IF NOT EXISTS ''Elegida''';
  END IF;
END $$;

-- ==============================================================================
-- ¡ATENCIÓN! DEBES EJECUTAR EL PASO 1 PRIMERO. 
-- LUEGO, EN UNA EJECUCIÓN SEPARADA (NUEVA CONSULTA), EJECUTA EL PASO 2:
-- ==============================================================================

-- PASO 2: Ejecutar este bloque DESPUÉS de que el Paso 1 haya terminado
DO $$ 
BEGIN
    -- Intentar eliminar el constraint si existe
    ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_status_check;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- Actualizar los registros existentes
UPDATE properties SET status = 'Elegida' WHERE status = 'Favorita';

-- Agregar el nuevo constraint con los valores actualizados
ALTER TABLE properties ADD CONSTRAINT properties_status_check 
CHECK (status IN (
    'Sugerida', 
    'Elegida', 
    'Contactada', 
    'Visitada', 
    'Ofertada', 
    'Disponible', 
    'Reservada', 
    'Vendida', 
    'Alquilada', 
    'Descartada', 
    'Vendida por otra inmobiliaria', 
    'Alquilada por otra inmobiliaria', 
    'Suspendida'
));
