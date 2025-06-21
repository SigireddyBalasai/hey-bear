-- Comprehensive RLS policies for all tables
-- Add missing RLS policies to ensure users can only access their own data
-- Note: assistants table policies already exist from previous migration

-- 1. ASSISTANT_CONFIGS TABLE - Access via id (references assistants.id)
CREATE POLICY "Users can view their assistant configs" ON "public"."assistant_configs" 
FOR SELECT USING ("id" IN (
    SELECT "id" FROM "public"."assistants" WHERE "user_id" = "auth"."uid"()
));

CREATE POLICY "Users can insert their assistant configs" ON "public"."assistant_configs" 
FOR INSERT WITH CHECK ("id" IN (
    SELECT "id" FROM "public"."assistants" WHERE "user_id" = "auth"."uid"()
));

CREATE POLICY "Users can update their assistant configs" ON "public"."assistant_configs" 
FOR UPDATE USING ("id" IN (
    SELECT "id" FROM "public"."assistants" WHERE "user_id" = "auth"."uid"()
));

CREATE POLICY "Users can delete their assistant configs" ON "public"."assistant_configs" 
FOR DELETE USING ("id" IN (
    SELECT "id" FROM "public"."assistants" WHERE "user_id" = "auth"."uid"()
));

-- 2. ASSISTANT_SUBSCRIPTIONS TABLE - Access via assistant_id
CREATE POLICY "Users can view their assistant subscriptions" ON "public"."assistant_subscriptions" 
FOR SELECT USING ("assistant_id" IN (
    SELECT "id" FROM "public"."assistants" WHERE "user_id" = "auth"."uid"()
));

CREATE POLICY "Users can insert their assistant subscriptions" ON "public"."assistant_subscriptions" 
FOR INSERT WITH CHECK ("assistant_id" IN (
    SELECT "id" FROM "public"."assistants" WHERE "user_id" = "auth"."uid"()
));

CREATE POLICY "Users can update their assistant subscriptions" ON "public"."assistant_subscriptions" 
FOR UPDATE USING ("assistant_id" IN (
    SELECT "id" FROM "public"."assistants" WHERE "user_id" = "auth"."uid"()
));

CREATE POLICY "Users can delete their assistant subscriptions" ON "public"."assistant_subscriptions" 
FOR DELETE USING ("assistant_id" IN (
    SELECT "id" FROM "public"."assistants" WHERE "user_id" = "auth"."uid"()
));

-- 3. ASSISTANT_USAGE_LIMITS TABLE - Access via assistant_id
CREATE POLICY "Users can view their assistant usage limits" ON "public"."assistant_usage_limits" 
FOR SELECT USING ("assistant_id" IN (
    SELECT "id" FROM "public"."assistants" WHERE "user_id" = "auth"."uid"()
));

CREATE POLICY "Users can insert their assistant usage limits" ON "public"."assistant_usage_limits" 
FOR INSERT WITH CHECK ("assistant_id" IN (
    SELECT "id" FROM "public"."assistants" WHERE "user_id" = "auth"."uid"()
));

CREATE POLICY "Users can update their assistant usage limits" ON "public"."assistant_usage_limits" 
FOR UPDATE USING ("assistant_id" IN (
    SELECT "id" FROM "public"."assistants" WHERE "user_id" = "auth"."uid"()
));

CREATE POLICY "Users can delete their assistant usage limits" ON "public"."assistant_usage_limits" 
FOR DELETE USING ("assistant_id" IN (
    SELECT "id" FROM "public"."assistants" WHERE "user_id" = "auth"."uid"()
));

-- 4. ASSISTANT_ACTIVITY TABLE - Access via assistant_id
CREATE POLICY "Users can view their assistant activity" ON "public"."assistant_activity" 
FOR SELECT USING ("assistant_id" IN (
    SELECT "id" FROM "public"."assistants" WHERE "user_id" = "auth"."uid"()
));

CREATE POLICY "Users can insert their assistant activity" ON "public"."assistant_activity" 
FOR INSERT WITH CHECK ("assistant_id" IN (
    SELECT "id" FROM "public"."assistants" WHERE "user_id" = "auth"."uid"()
));

CREATE POLICY "Users can update their assistant activity" ON "public"."assistant_activity" 
FOR UPDATE USING ("assistant_id" IN (
    SELECT "id" FROM "public"."assistants" WHERE "user_id" = "auth"."uid"()
));

CREATE POLICY "Users can delete their assistant activity" ON "public"."assistant_activity" 
FOR DELETE USING ("assistant_id" IN (
    SELECT "id" FROM "public"."assistants" WHERE "user_id" = "auth"."uid"()
));

-- 5. PHONE_NUMBERS TABLE - Access via assistant_id (can be null for unassigned numbers)
CREATE POLICY "Users can view their assigned phone numbers" ON "public"."phone_numbers" 
FOR SELECT USING (
    "assistant_id" IS NULL OR 
    "assistant_id" IN (
        SELECT "id" FROM "public"."assistants" WHERE "user_id" = "auth"."uid"()
    )
);

CREATE POLICY "Users can update their assigned phone numbers" ON "public"."phone_numbers" 
FOR UPDATE USING (
    "assistant_id" IS NULL OR 
    "assistant_id" IN (
        SELECT "id" FROM "public"."assistants" WHERE "user_id" = "auth"."uid"()
    )
);

-- 6. INTERACTIONS TABLE - Has both user_id and assistant_id
CREATE POLICY "Users can insert their own interactions" ON "public"."interactions" 
FOR INSERT WITH CHECK ("user_id" = "auth"."uid"());

CREATE POLICY "Users can update their own interactions" ON "public"."interactions" 
FOR UPDATE USING ("user_id" = "auth"."uid"());

CREATE POLICY "Users can delete their own interactions" ON "public"."interactions" 
FOR DELETE USING ("user_id" = "auth"."uid"());

-- 7. USAGE_STATISTICS TABLE - entity_id can be user_id or assistant_id
CREATE POLICY "Users can view their usage statistics" ON "public"."usage_statistics" 
FOR SELECT USING (
    ("entity_type" = 'user' AND "entity_id" = "auth"."uid"()) OR
    ("entity_type" = 'assistant' AND "entity_id" IN (
        SELECT "id" FROM "public"."assistants" WHERE "user_id" = "auth"."uid"()
    ))
);

CREATE POLICY "Users can insert their usage statistics" ON "public"."usage_statistics" 
FOR INSERT WITH CHECK (
    ("entity_type" = 'user' AND "entity_id" = "auth"."uid"()) OR
    ("entity_type" = 'assistant' AND "entity_id" IN (
        SELECT "id" FROM "public"."assistants" WHERE "user_id" = "auth"."uid"()
    ))
);

CREATE POLICY "Users can update their usage statistics" ON "public"."usage_statistics" 
FOR UPDATE USING (
    ("entity_type" = 'user' AND "entity_id" = "auth"."uid"()) OR
    ("entity_type" = 'assistant' AND "entity_id" IN (
        SELECT "id" FROM "public"."assistants" WHERE "user_id" = "auth"."uid"()
    ))
);

CREATE POLICY "Users can delete their usage statistics" ON "public"."usage_statistics" 
FOR DELETE USING (
    ("entity_type" = 'user' AND "entity_id" = "auth"."uid"()) OR
    ("entity_type" = 'assistant' AND "entity_id" IN (
        SELECT "id" FROM "public"."assistants" WHERE "user_id" = "auth"."uid"()
    ))
);

-- 8. AUDIT_LOGS TABLE - performed_by is user_id, but entity_id could be anything
CREATE POLICY "Users can view audit logs they created" ON "public"."audit_logs" 
FOR SELECT USING ("performed_by" = "auth"."uid"());

CREATE POLICY "Users can insert their own audit logs" ON "public"."audit_logs" 
FOR INSERT WITH CHECK ("performed_by" = "auth"."uid"());

-- Note: payment_sessions and interactions already have some policies
-- Note: assistant_limits and historical_usage already have policies
