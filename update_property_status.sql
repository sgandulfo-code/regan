-- PropBrain Database Schema Update
-- Ejecuta este bloque en Supabase para habilitar las nuevas funcionalidades y corregir permisos

-- 1. Actualizar el tipo enum para PropertyStatus
-- En Supabase, los estados de las propiedades se guardan como texto, por lo que no hay un ENUM estricto a nivel de base de datos para 'status' en la tabla properties.
-- Sin embargo, si has creado un constraint CHECK para el status en la tabla properties, debes actualizarlo.
-- Si no tienes un constraint CHECK, este paso no es necesario, pero es una buena práctica.

DO $$ 
BEGIN
    -- Intentar eliminar el constraint si existe (el nombre puede variar, ajusta si es necesario)
    ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_status_check;
EXCEPTION
    WHEN undefined_object THEN
        -- El constraint no existe, no hacer nada
        NULL;
END $$;

-- Agregar el nuevo constraint con los valores actualizados
ALTER TABLE properties ADD CONSTRAINT properties_status_check 
CHECK (status IN (
    'Wishlist', 
    'Contacted', 
    'Visited', 
    'Offered', 
    'Discarded', 
    'Vendida', 
    'Vendida por otra inmobiliaria', 
    'Cancelada'
));

-- 2. Actualizar registros existentes
-- Si ya tenías propiedades con el estado anterior ('Vendida por otro'), actualízalas al nuevo valor
UPDATE properties 
SET status = 'Vendida por otra inmobiliaria' 
WHERE status = 'Vendida por otro';

-- Nota: Asegúrate de que la tabla 'properties' existe antes de ejecutar esto.
