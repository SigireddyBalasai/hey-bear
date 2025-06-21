-- Ensure interactions table has proper RLS SELECT policy
-- This migration safely checks and creates the policy if it doesn't exist

-- Drop the policy if it exists and recreate it to ensure it's correct
DROP POLICY IF EXISTS "Users can view their own interactions" ON "public"."interactions";

-- Create the SELECT policy for interactions
CREATE POLICY "Users can view their own interactions" ON "public"."interactions"
FOR SELECT USING ("user_id" = "auth"."uid"());

-- Ensure RLS is enabled on the interactions table
ALTER TABLE "public"."interactions" ENABLE ROW LEVEL SECURITY;

-- Also check and ensure INSERT policy exists for interactions
DROP POLICY IF EXISTS "Users can insert their own interactions" ON "public"."interactions";

CREATE POLICY "Users can insert their own interactions" ON "public"."interactions"
FOR INSERT WITH CHECK ("user_id" = "auth"."uid"());
