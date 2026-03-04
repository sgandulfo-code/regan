ALTER TABLE visits ADD COLUMN client_checklist JSONB DEFAULT '[]'::jsonb;
