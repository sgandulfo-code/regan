-- SOLUCIÓN DE EMERGENCIA PARA PERMISOS
-- Ejecuta este script COMPLETO en el SQL Editor de Supabase

-- 1. Desbloquear acceso a la tabla de usuarios (Soluciona el error "permission denied for table users")
GRANT SELECT ON TABLE auth.users TO authenticated;

-- 2. Asegurar que RLS está activo
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE folder_shares ENABLE ROW LEVEL SECURITY;

-- 3. Corregir Políticas de Visitas (Eliminando referencias antiguas)
DROP POLICY IF EXISTS "Users can manage their own visits" ON visits;
DROP POLICY IF EXISTS "Users can see visits in folders they have access to" ON visits;

CREATE POLICY "Users can manage their own visits" ON visits
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can see visits in folders they have access to" ON visits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM folder_shares
      WHERE folder_shares.folder_id = visits.folder_id
      AND folder_shares.user_email = (auth.jwt() ->> 'email')
    )
  );

-- 4. Corregir Políticas de Carpetas Compartidas
DROP POLICY IF EXISTS "Users can see shares for their folders" ON folder_shares;
DROP POLICY IF EXISTS "Users can see shares invited to them" ON folder_shares;

CREATE POLICY "Users can see shares for their folders" ON folder_shares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM folders 
      WHERE folders.id = folder_shares.folder_id 
      AND folders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can see shares invited to them" ON folder_shares
  FOR SELECT USING (user_email = (auth.jwt() ->> 'email'));

-- 5. Asegurar columnas de fecha/hora
ALTER TABLE visits ADD COLUMN IF NOT EXISTS visit_date DATE;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS visit_time TIME;
