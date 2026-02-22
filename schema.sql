
-- PropBrain Database Schema Update
-- Ejecuta este bloque en Supabase para habilitar las nuevas funcionalidades y corregir permisos

-- 1. Crear el nuevo tipo de transacción si no existe
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
        CREATE TYPE transaction_type AS ENUM ('Compra', 'Alquiler');
    END IF;
END $$;

-- 2. Actualizar la tabla folders
ALTER TABLE folders 
ADD COLUMN IF NOT EXISTS budget NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS transaction_type transaction_type DEFAULT 'Compra'::transaction_type;

-- 3. Tabla de Visitas
CREATE TABLE IF NOT EXISTS visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  visit_time TIME NOT NULL,
  contact_name TEXT,
  contact_phone TEXT,
  checklist JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  status TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled')),
  client_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabla de Carpetas Compartidas
CREATE TABLE IF NOT EXISTS folder_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  permission TEXT DEFAULT 'view' CHECK (permission IN ('view', 'edit', 'admin')),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(folder_id, user_email)
);

-- 5. Tabla de Itinerarios Compartidos (Públicos)
CREATE TABLE IF NOT EXISTS shared_itineraries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{"showPrices": true, "showNotes": false, "showChecklist": false}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Habilitar RLS en las nuevas tablas
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE folder_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_itineraries ENABLE ROW LEVEL SECURITY;

-- 7. Políticas de RLS para Visitas
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

-- 8. Políticas de RLS para Folder Shares
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

-- 9. Políticas de RLS para Shared Itineraries
DROP POLICY IF EXISTS "Public can view active shared itineraries" ON shared_itineraries;
CREATE POLICY "Public can view active shared itineraries" ON shared_itineraries
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Owners can manage shared itineraries" ON shared_itineraries;
CREATE POLICY "Owners can manage shared itineraries" ON shared_itineraries
  FOR ALL USING (auth.uid() = created_by);
