
-- Crear tabla de actividades para el Feed de Agente
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
-- 1. Los agentes pueden ver sus propias actividades
DROP POLICY IF EXISTS "Agents can view their own activities" ON activities;
CREATE POLICY "Agents can view their own activities" ON activities
  FOR SELECT USING (auth.uid() = agent_id);

-- 2. Permitir inserción pública (para cuando un cliente ve un itinerario compartido)
DROP POLICY IF EXISTS "Public can insert activities" ON activities;
CREATE POLICY "Public can insert activities" ON activities
  FOR INSERT WITH CHECK (true);

-- 3. Los agentes pueden borrar sus actividades (opcional)
DROP POLICY IF EXISTS "Agents can delete their own activities" ON activities;
CREATE POLICY "Agents can delete their own activities" ON activities
  FOR DELETE USING (auth.uid() = agent_id);
