
-- PropBrain Database Schema Update
-- Ejecuta este bloque en Supabase para habilitar los nuevos campos

-- 1. Crear el nuevo tipo de transacción
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
        CREATE TYPE transaction_type AS ENUM ('Compra', 'Alquiler');
    END IF;
END $$;

-- 2. Actualizar la tabla folders
ALTER TABLE folders 
ADD COLUMN IF NOT EXISTS budget NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS transaction_type transaction_type DEFAULT 'Compra'::transaction_type;
