-- Añadir columna de estado a link_inbox para rastrear si un link fue procesado
ALTER TABLE link_inbox ADD COLUMN IF NOT EXISTS status text DEFAULT 'enviado';

-- Actualizar los links existentes
UPDATE link_inbox SET status = 'enviado' WHERE status IS NULL;
