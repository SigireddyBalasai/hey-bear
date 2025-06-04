-- Fix payment_sessions foreign key to reference users table instead of auth.users

-- Drop the existing foreign key constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'payment_sessions_user_id_fkey' 
    AND table_name = 'payment_sessions'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.payment_sessions DROP CONSTRAINT payment_sessions_user_id_fkey;
  END IF;
END $$;

-- Add the correct foreign key constraint to reference users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'payment_sessions_user_id_fkey' 
    AND table_name = 'payment_sessions'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.payment_sessions 
    ADD CONSTRAINT payment_sessions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update RLS policies to work with the correct user_id
DROP POLICY IF EXISTS "Users can view their own payment sessions" ON public.payment_sessions;
DROP POLICY IF EXISTS "Users can insert their own payment sessions" ON public.payment_sessions;
DROP POLICY IF EXISTS "Users can update their own payment sessions" ON public.payment_sessions;

-- Create new RLS policies that work with the users table
CREATE POLICY "Users can view their own payment sessions" ON public.payment_sessions
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own payment sessions" ON public.payment_sessions
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own payment sessions" ON public.payment_sessions
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );
