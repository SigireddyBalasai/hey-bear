-- Fix missing SELECT policy for interactions table
-- Users should be able to view their own interactions

CREATE POLICY "Users can view their own interactions" ON "public"."interactions" 
FOR SELECT USING ("user_id" = "auth"."uid"());
