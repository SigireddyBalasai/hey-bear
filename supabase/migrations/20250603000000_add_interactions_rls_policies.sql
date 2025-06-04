-- Add Row Level Security policies for interactions table
-- This migration adds policies to allow users to access their own interactions

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own interactions" ON interactions;
DROP POLICY IF EXISTS "Users can insert their own interactions" ON interactions;
DROP POLICY IF EXISTS "Admins can view all interactions" ON interactions;
DROP POLICY IF EXISTS "Service role can access all interactions" ON interactions;

-- Policy to allow users to view their own interactions
CREATE POLICY "Users can view their own interactions" ON interactions
  FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow users to insert their own interactions
CREATE POLICY "Users can insert their own interactions" ON interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for service role to access all interactions (for admin operations)
CREATE POLICY "Service role can access all interactions" ON interactions
  FOR ALL USING (true);

-- Policy for admins to view all interactions (for admin functionality)
-- Note: This uses a simpler approach to avoid recursion issues
CREATE POLICY "Admins can view all interactions" ON interactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
    )
  );
