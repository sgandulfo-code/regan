-- Actualización de estados para PropBrain (Fase 2)
-- Ejecuta este script en el SQL Editor de Supabase

-- 0. ACTUALIZAR TIPOS ENUM (Si existen)
-- Nota: En Supabase, a veces los estados se crean como tipos ENUM. 
-- Ejecutamos esto primero para agregar los nuevos valores permitidos.
ALTER TYPE folder_status ADD VALUE IF NOT EXISTS 'Ganada';
ALTER TYPE folder_status ADD VALUE IF NOT EXISTS 'Perdida';
ALTER TYPE folder_status ADD VALUE IF NOT EXISTS 'Cancelada';

-- (Opcional) Si property_status también es un ENUM, agregamos los valores:
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_status') THEN
    EXECUTE 'ALTER TYPE property_status ADD VALUE IF NOT EXISTS ''Sugerida''';
    EXECUTE 'ALTER TYPE property_status ADD VALUE IF NOT EXISTS ''Favorita''';
    EXECUTE 'ALTER TYPE property_status ADD VALUE IF NOT EXISTS ''Contactada''';
    EXECUTE 'ALTER TYPE property_status ADD VALUE IF NOT EXISTS ''Visitada''';
    EXECUTE 'ALTER TYPE property_status ADD VALUE IF NOT EXISTS ''Ofertada''';
    EXECUTE 'ALTER TYPE property_status ADD VALUE IF NOT EXISTS ''Disponible''';
    EXECUTE 'ALTER TYPE property_status ADD VALUE IF NOT EXISTS ''Reservada''';
    EXECUTE 'ALTER TYPE property_status ADD VALUE IF NOT EXISTS ''Vendida''';
    EXECUTE 'ALTER TYPE property_status ADD VALUE IF NOT EXISTS ''Alquilada''';
    EXECUTE 'ALTER TYPE property_status ADD VALUE IF NOT EXISTS ''Descartada''';
    EXECUTE 'ALTER TYPE property_status ADD VALUE IF NOT EXISTS ''Vendida por otra inmobiliaria''';
    EXECUTE 'ALTER TYPE property_status ADD VALUE IF NOT EXISTS ''Alquilada por otra inmobiliaria''';
    EXECUTE 'ALTER TYPE property_status ADD VALUE IF NOT EXISTS ''Suspendida''';
  END IF;
END $$;

-- 1. ACTUALIZAR ESTADOS DE CARPETAS (SearchFolder)
-- Actualizamos los registros existentes
UPDATE folders SET status = 'Ganada' WHERE status = 'Cerrada';
UPDATE folders SET operation_type = 'Búsqueda Compra' WHERE operation_type = 'Búsqueda';

-- Si existe algún constraint en folders, lo actualizamos (por si acaso)
DO $$ 
BEGIN
    ALTER TABLE folders DROP CONSTRAINT IF EXISTS folders_status_check;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- 2. ACTUALIZAR ESTADOS DE PROPIEDADES (Property)
-- Actualizamos los registros existentes a los nuevos nombres en español
UPDATE properties SET status = 'Sugerida' WHERE status = 'Wishlist';
UPDATE properties SET status = 'Contactada' WHERE status = 'Contacted';
UPDATE properties SET status = 'Visitada' WHERE status = 'Visited';
UPDATE properties SET status = 'Ofertada' WHERE status = 'Offered';
UPDATE properties SET status = 'Descartada' WHERE status = 'Discarded';
UPDATE properties SET status = 'Suspendida' WHERE status = 'Cancelada';

-- Actualizamos el constraint de la tabla properties
DO $$ 
BEGIN
    ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_status_check;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE folders ADD CONSTRAINT folders_status_check 
CHECK (status IN ('Pendiente', 'Abierta', 'Ganada', 'Perdida', 'Cancelada'));

ALTER TABLE properties ADD CONSTRAINT properties_status_check 
CHECK (status IN (
    'Sugerida', 
    'Favorita', 
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
