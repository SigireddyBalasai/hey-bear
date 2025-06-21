-- Add missing RLS policies for assistants table
-- Users should be able to view, insert, update, and delete their own assistants

CREATE POLICY "Users can view their own assistants" ON "public"."assistants" 
FOR SELECT USING ("user_id" = "auth"."uid"());

CREATE POLICY "Users can insert their own assistants" ON "public"."assistants" 
FOR INSERT WITH CHECK ("user_id" = "auth"."uid"());

CREATE POLICY "Users can update their own assistants" ON "public"."assistants" 
FOR UPDATE USING ("user_id" = "auth"."uid"());

CREATE POLICY "Users can delete their own assistants" ON "public"."assistants" 
FOR DELETE USING ("user_id" = "auth"."uid"());
