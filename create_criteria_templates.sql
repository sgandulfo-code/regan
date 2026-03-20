
-- Tabla para plantillas de criterios reutilizables
CREATE TABLE IF NOT EXISTS criteria_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  fields JSONB DEFAULT '[]'::jsonb, -- Array de {id, label, type, options, required}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE criteria_templates ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Agents can manage their own templates" ON criteria_templates;
CREATE POLICY "Agents can manage their own templates" ON criteria_templates
  FOR ALL USING (auth.uid() = agent_id);

-- Permitir que otros vean plantillas si se comparten (opcional, por ahora solo el dueño)
-- DROP POLICY IF EXISTS "Users can view shared templates" ON criteria_templates;
-- CREATE POLICY "Users can view shared templates" ON criteria_templates
--   FOR SELECT USING (true);
