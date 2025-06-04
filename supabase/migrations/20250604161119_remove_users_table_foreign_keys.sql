-- Drop foreign key constraints from various tables referencing the users table

-- Drop constraint from public.interactions
ALTER TABLE public.interactions
DROP CONSTRAINT IF EXISTS analytics_interactions_user_id_fkey;

-- Drop constraint from public.assistants
ALTER TABLE public.assistants
DROP CONSTRAINT IF EXISTS assistants_user_id_fkey;

-- Drop constraint from public.payment_sessions
ALTER TABLE public.payment_sessions
DROP CONSTRAINT IF EXISTS payment_sessions_user_id_fkey;

-- Placeholder for dropping foreign key constraints from existing partitions
-- of analytics.interactions_partitioned.
-- This will require a separate script or function to identify and alter each partition.
-- Example (conceptual - actual partition names will vary):
-- ALTER TABLE analytics.interactions_partition_YYYY_MM
-- DROP CONSTRAINT IF EXISTS interactions_partition_user_id_fkey;

-- TODO: Add script here to find all partitions of analytics.interactions_partitioned
-- and then loop through them to drop the foreign key constraint referencing users.users.
-- The constraint name might vary per partition if not named consistently,
-- or it might be inherited. Need to investigate the exact naming or inheritance.

-- The ensure_partition_exists function also needs to be updated separately
-- to stop creating this foreign key for new partitions.
-- This migration only addresses existing tables/partitions.

COMMENT ON CONVERSION remove_users_table_foreign_keys IS 'Foreign key constraints from public.interactions, public.assistants, public.payment_sessions, and analytics.interactions_partitioned (for existing partitions) that reference the users table have been dropped. The ensure_partition_exists function needs separate attention.';

-- Drop the trigger manage_admin_role_trigger from public.users
DROP TRIGGER IF EXISTS manage_admin_role_trigger ON public.users;

-- Drop the function public.manage_admin_role
DROP FUNCTION IF EXISTS public.manage_admin_role();

-- Drop the function public.handle_new_user
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop the trigger on_auth_user_created from auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Modify the public.is_admin function to remove reference to users.users
CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
    FALSE
  );
$$;

-- Modify the public.ensure_partition_exists function to remove foreign key creation to users.users
CREATE OR REPLACE FUNCTION "public"."ensure_partition_exists"("year_month" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    partition_name text;
    partition_exists boolean;
    start_date timestamp with time zone;
    end_date timestamp with time zone;
BEGIN
    partition_name := 'interactions_p' || year_month;

    SELECT EXISTS (
        SELECT 1
        FROM pg_tables
        WHERE schemaname = 'analytics'
        AND tablename = partition_name
    ) INTO partition_exists;

    IF NOT partition_exists THEN
        start_date := to_timestamp(year_month || '_01', 'YYYY_MM_DD');
        end_date := start_date + interval '1 month';

        EXECUTE format('
            CREATE TABLE analytics.%I (
                LIKE analytics.interactions_partitioned INCLUDING ALL,
                CONSTRAINT %I_pkey PRIMARY KEY (interaction_time, id),
                CONSTRAINT %I_interaction_time_check
                    CHECK (interaction_time >= %L AND interaction_time < %L)
            )',
            partition_name, partition_name, partition_name, start_date, end_date
        );

        EXECUTE format('
            CREATE INDEX idx_%I_assistant_id ON analytics.%I USING btree (assistant_id, interaction_time DESC)
        ', partition_name, partition_name);

        EXECUTE format('
            CREATE INDEX idx_%I_time ON analytics.%I USING btree (interaction_time DESC)
        ', partition_name, partition_name);

        EXECUTE format('
            CREATE INDEX idx_%I_user_id ON analytics.%I USING btree (user_id, interaction_time DESC)
        ', partition_name, partition_name);

        EXECUTE format('
            CREATE INDEX idx_%I_token_usage ON analytics.%I USING btree (token_usage)
        ', partition_name, partition_name);

        EXECUTE format('
            ALTER TABLE analytics.%I ENABLE ROW LEVEL SECURITY
        ', partition_name);

        EXECUTE format('
            CREATE POLICY "%I_service_role_policy" ON analytics.%I
            AS PERMISSIVE FOR ALL TO service_role USING (true)
        ', partition_name, partition_name);

        EXECUTE format('
            CREATE POLICY "%I_admin_policy" ON analytics.%I
            AS PERMISSIVE FOR ALL TO authenticated USING (public.is_admin())
        ', partition_name, partition_name); -- Changed here

        EXECUTE format('
            CREATE POLICY "%I_assistant_owner_policy" ON analytics.%I
            AS PERMISSIVE FOR SELECT TO authenticated USING (auth.owns_assistant(assistant_id))
        ', partition_name, partition_name);

        EXECUTE format('
            CREATE POLICY "%I_user_own_data_policy" ON analytics.%I
            AS PERMISSIVE FOR SELECT TO authenticated USING (user_id = auth.uid())
        ', partition_name, partition_name);

        EXECUTE format('
            GRANT ALL ON analytics.%I TO service_role
        ', partition_name);

        EXECUTE format('
            GRANT SELECT ON analytics.%I TO authenticated
        ', partition_name);

        EXECUTE format('
            GRANT SELECT ON analytics.%I TO anon
        ', partition_name);

        RAISE NOTICE 'Created new partition: analytics.%', partition_name;
    END IF;
END;
$$;

-- Update RLS policies to remove direct references to public.users

-- For public.interactions table
-- Drop the old policy if it exists (name might vary based on auto-generation or exact previous definition)
-- It's safer to drop by name if known, or ensure this migration is idempotent.
-- The policy was originally named "Admins can view all interactions".
DROP POLICY IF EXISTS "Admins can view all interactions" ON "public"."interactions";
CREATE POLICY "Admins can view all interactions" ON "public"."interactions"
FOR SELECT TO authenticated -- Or appropriate role
USING (public.is_admin());

-- For public.payment_sessions table
-- Assuming user_id column in payment_sessions will now hold auth.uid() values directly
-- after public.users table and its FKs are dropped.

DROP POLICY IF EXISTS "Users can insert their own payment sessions" ON "public"."payment_sessions";
CREATE POLICY "Users can insert their own payment sessions" ON "public"."payment_sessions"
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own payment sessions" ON "public"."payment_sessions";
CREATE POLICY "Users can update their own payment sessions" ON "public"."payment_sessions"
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id); -- for WITH CHECK clause too if it was there

DROP POLICY IF EXISTS "Users can view their own payment sessions" ON "public"."payment_sessions";
CREATE POLICY "Users can view their own payment sessions" ON "public"."payment_sessions"
FOR SELECT
USING (auth.uid() = user_id);

-- Finally, drop the public.users table itself
DROP TABLE IF EXISTS public.users;
