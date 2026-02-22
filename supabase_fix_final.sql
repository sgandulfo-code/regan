-- REPARACIÓN DE PERMISOS RLS (SOLUCIÓN DEFINITIVA ERROR 403)

-- 1. Habilitar RLS
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE folder_shares ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para VISITAS (Sin consultar auth.users)
DROP POLICY IF EXISTS "Users can manage their own visits" ON visits;
CREATE POLICY "Users can manage their own visits" ON visits
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can see visits in folders they have access to" ON visits;
CREATE POLICY "Users can see visits in folders they have access to" ON visits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM folder_shares
      WHERE folder_shares.folder_id = visits.folder_id
      -- Usamos auth.jwt() para obtener el email de forma segura
      AND folder_shares.user_email = (auth.jwt() ->> 'email')
    )
  );

-- 3. Políticas para CARPETAS COMPARTIDAS (Sin consultar auth.users)
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
  FOR SELECT USING (
    -- Usamos auth.jwt() para obtener el email de forma segura
    user_email = (auth.jwt() ->> 'email')
  );

-- 4. Asegurar que las columnas de fecha existen
ALTER TABLE visits ADD COLUMN IF NOT EXISTS visit_date DATE;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS visit_time TIME;
