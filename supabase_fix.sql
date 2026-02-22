-- REPARACIÓN INTEGRAL DE LA BASE DE DATOS
-- Ejecuta todo este script en el SQL Editor de Supabase para corregir los errores 400 y 403

-- 1. Corregir tabla visits (Columnas de fecha/hora)
DO $$
BEGIN
    -- Renombrar 'date' a 'visit_date' si existe y 'visit_date' no
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visits' AND column_name='date') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visits' AND column_name='visit_date') THEN
        ALTER TABLE visits RENAME COLUMN "date" TO visit_date;
    END IF;

    -- Renombrar 'time' a 'visit_time' si existe y 'visit_time' no
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visits' AND column_name='time') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visits' AND column_name='visit_time') THEN
        ALTER TABLE visits RENAME COLUMN "time" TO visit_time;
    END IF;
END $$;

-- Asegurar que las columnas existen (si no se renombraron)
ALTER TABLE visits ADD COLUMN IF NOT EXISTS visit_date DATE;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS visit_time TIME;

-- 2. Asegurar que RLS está habilitado
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE folder_shares ENABLE ROW LEVEL SECURITY;

-- 3. Reiniciar Políticas de Visitas (Soluciona error 403/400 en visits)
DROP POLICY IF EXISTS "Users can manage their own visits" ON visits;
CREATE POLICY "Users can manage their own visits" ON visits
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can see visits in folders they have access to" ON visits;
CREATE POLICY "Users can see visits in folders they have access to" ON visits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM folder_shares
      WHERE folder_shares.folder_id = visits.folder_id
      AND folder_shares.user_email = auth.jwt() ->> 'email'
    )
  );

-- 4. Reiniciar Políticas de Carpetas Compartidas (Soluciona error 403 en folder_shares)
DROP POLICY IF EXISTS "Users can see shares for their folders" ON folder_shares;
CREATE POLICY "Users can see shares for their folders" ON folder_shares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM folders 
      WHERE folders.id = folder_shares.folder_id 
      AND folders.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can see shares invited to them" ON folder_shares;
CREATE POLICY "Users can see shares invited to them" ON folder_shares
  FOR SELECT USING (user_email = auth.jwt() ->> 'email');

-- 5. Forzar recarga del caché de esquema de Supabase
NOTIFY pgrst, 'reload config';
