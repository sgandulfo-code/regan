-- Add new roles to the user_role enum if it exists
DO $$
BEGIN
    -- Check if the type exists
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        -- Add 'Agent' if not exists
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'Agent';
        -- Add 'Client' if not exists
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'Client';
    END IF;
END $$;
