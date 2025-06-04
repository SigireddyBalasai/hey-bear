-- Fix Row Level Security policies for users table
-- This migration removes problematic admin policies that cause infinite recursion

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;

-- Ensure RLS is enabled on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own profile only
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = auth_user_id);

-- Policy to allow users to update their own profile only
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- Policy to allow users to insert their own profile during signup
CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- Note: Admin operations should use the service client to bypass RLS
-- This avoids infinite recursion issues with policy checks
