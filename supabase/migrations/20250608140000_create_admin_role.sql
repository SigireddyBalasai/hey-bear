-- Create admin role if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'admin') THEN
        CREATE ROLE admin;
        RAISE NOTICE 'Created admin role';
    ELSE
        RAISE NOTICE 'Admin role already exists';
    END IF;
END
$$;
