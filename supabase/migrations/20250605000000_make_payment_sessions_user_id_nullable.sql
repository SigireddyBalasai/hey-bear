-- Make user_id column in payment_sessions table nullable
-- The foreign key constraint payment_sessions_user_id_fkey (to public.users.id)
-- will remain. PostgreSQL allows FK columns to be nullable; the constraint
-- is only checked if the value is not NULL.

ALTER TABLE public.payment_sessions
ALTER COLUMN user_id DROP NOT NULL;
