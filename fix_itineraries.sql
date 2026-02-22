-- REPARACIÓN DE ITINERARIOS COMPARTIDOS
-- Ejecuta esto en Supabase SQL Editor para arreglar el botón de "Generar Nuevo Link"

-- 1. Asegurar tabla
CREATE TABLE IF NOT EXISTS shared_itineraries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{"showPrices": true, "showNotes": false, "showChecklist": false}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar RLS
ALTER TABLE shared_itineraries ENABLE ROW LEVEL SECURITY;

-- 3. Limpiar políticas antiguas
DROP POLICY IF EXISTS "Public can view active shared itineraries" ON shared_itineraries;
DROP POLICY IF EXISTS "Owners can manage shared itineraries" ON shared_itineraries;
DROP POLICY IF EXISTS "Users can create shared itineraries" ON shared_itineraries;

-- 4. Crear políticas nuevas y permisivas
-- Cualquiera puede ver itinerarios activos (público)
CREATE POLICY "Public can view active shared itineraries" ON shared_itineraries
  FOR SELECT USING (is_active = true);

-- Los usuarios autenticados pueden crear itinerarios
CREATE POLICY "Users can create shared itineraries" ON shared_itineraries
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Los dueños pueden ver, actualizar y borrar sus itinerarios
CREATE POLICY "Owners can manage shared itineraries" ON shared_itineraries
  FOR ALL USING (auth.uid() = created_by);

-- 5. Dar permisos a la tabla (CRÍTICO)
GRANT ALL ON TABLE shared_itineraries TO authenticated;
GRANT SELECT ON TABLE shared_itineraries TO anon;
