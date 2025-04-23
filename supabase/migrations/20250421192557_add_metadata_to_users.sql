-- Add metadata column to users table
ALTER TABLE public.users 
ADD COLUMN metadata JSONB DEFAULT NULL;

COMMENT ON COLUMN public.users.metadata IS 'JSON column for storing flexible user metadata';
