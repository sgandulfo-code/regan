-- Check if there is a check constraint on the role column
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_name = 'profiles'
        AND constraint_type = 'CHECK'
        AND constraint_name = 'profiles_role_check'
    ) THEN
        ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
        ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('Buyer', 'Architect', 'Contractor', 'Agent', 'Client'));
    END IF;
END $$;
