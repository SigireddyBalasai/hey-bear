

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "analytics";


ALTER SCHEMA "analytics" OWNER TO "postgres";


COMMENT ON SCHEMA "analytics" IS 'Schema for analytics data - recreated for rollback';



CREATE SCHEMA IF NOT EXISTS "assistants";


ALTER SCHEMA "assistants" OWNER TO "postgres";


COMMENT ON SCHEMA "assistants" IS 'Schema for assistant-related tables - recreated for rollback';



CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'Main schema containing all tables (consolidated from analytics, assistants, and users schemas on 2025-06-01)';



CREATE SCHEMA IF NOT EXISTS "users";


ALTER SCHEMA "users" OWNER TO "postgres";


COMMENT ON SCHEMA "users" IS 'Schema for user-related tables - recreated for rollback';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."country" AS ENUM (
    'US',
    'Canada'
);


ALTER TYPE "public"."country" OWNER TO "postgres";


CREATE TYPE "public"."monthly_interval" AS ENUM (
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
);


ALTER TYPE "public"."monthly_interval" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_file_chunk"("p_file_id" "uuid", "p_chunk_index" integer, "p_chunk_text" "text", "p_pinecone_id" "text", "p_metadata" "jsonb" DEFAULT NULL::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_chunk_id UUID;
BEGIN
    INSERT INTO "assistants"."file_chunks" (
        "file_id",
        "chunk_index",
        "chunk_text",
        "pinecone_id",
        "metadata"
    ) VALUES (
        p_file_id,
        p_chunk_index,
        p_chunk_text,
        p_pinecone_id,
        p_metadata
    ) RETURNING "id" INTO v_chunk_id;
    
    RETURN v_chunk_id;
END;
$$;


ALTER FUNCTION "public"."add_file_chunk"("p_file_id" "uuid", "p_chunk_index" integer, "p_chunk_text" "text", "p_pinecone_id" "text", "p_metadata" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."add_file_chunk"("p_file_id" "uuid", "p_chunk_index" integer, "p_chunk_text" "text", "p_pinecone_id" "text", "p_metadata" "jsonb") IS 'Add a file chunk to the database after processing';



CREATE OR REPLACE FUNCTION "public"."apply_partition_policies"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  partition_table text;
  table_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'analytics' AND tablename = 'interactions_partitioned'
  ) INTO table_exists;
  
  IF table_exists THEN
    DROP POLICY IF EXISTS "service_role_all" ON analytics.interactions_partitioned;
    
    CREATE POLICY "interactions_partitioned_service_role_policy" 
    ON analytics.interactions_partitioned
    AS PERMISSIVE FOR ALL
    TO service_role
    USING (true);
    
    CREATE POLICY "interactions_partitioned_admin_policy" 
    ON analytics.interactions_partitioned
    AS PERMISSIVE FOR ALL
    TO authenticated
    USING (public.is_admin()); -- Changed here
    
    CREATE POLICY "interactions_partitioned_assistant_owner_policy" 
    ON analytics.interactions_partitioned
    AS PERMISSIVE FOR SELECT
    TO authenticated
    USING (auth.owns_assistant(assistant_id));
    
    CREATE POLICY "interactions_partitioned_user_own_data_policy" 
    ON analytics.interactions_partitioned
    AS PERMISSIVE FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
  END IF;
  
  FOR partition_table IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'analytics' AND 
          tablename LIKE 'interactions_p2024_%' AND
          tablename NOT LIKE '%\_p\_%'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "service_role_all" ON analytics.' || partition_table;
    EXECUTE 'CREATE POLICY "' || partition_table || '_service_role_policy" ON analytics.' || partition_table || 
           ' AS PERMISSIVE FOR ALL TO service_role USING (true)';
    EXECUTE 'CREATE POLICY "' || partition_table || '_admin_policy" ON analytics.' || partition_table || 
           ' AS PERMISSIVE FOR ALL TO authenticated USING (public.is_admin())'; -- Changed here
    EXECUTE 'CREATE POLICY "' || partition_table || '_assistant_owner_policy" ON analytics.' || partition_table || 
           ' AS PERMISSIVE FOR SELECT TO authenticated USING (auth.owns_assistant(assistant_id))';
    EXECUTE 'CREATE POLICY "' || partition_table || '_user_own_data_policy" ON analytics.' || partition_table || 
           ' AS PERMISSIVE FOR SELECT TO authenticated USING (user_id = auth.uid())';
  END LOOP;
  
  FOR partition_table IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'analytics' AND 
          tablename LIKE 'interactions_p2025_%' AND
          tablename NOT LIKE '%\_p\_%'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "service_role_all" ON analytics.' || partition_table;
    EXECUTE 'CREATE POLICY "' || partition_table || '_service_role_policy" ON analytics.' || partition_table || 
           ' AS PERMISSIVE FOR ALL TO service_role USING (true)';
    EXECUTE 'CREATE POLICY "' || partition_table || '_admin_policy" ON analytics.' || partition_table || 
           ' AS PERMISSIVE FOR ALL TO authenticated USING (public.is_admin())'; -- Changed here
    EXECUTE 'CREATE POLICY "' || partition_table || '_assistant_owner_policy" ON analytics.' || partition_table || 
           ' AS PERMISSIVE FOR SELECT TO authenticated USING (auth.owns_assistant(assistant_id))';
    EXECUTE 'CREATE POLICY "' || partition_table || '_user_own_data_policy" ON analytics.' || partition_table || 
           ' AS PERMISSIVE FOR SELECT TO authenticated USING (user_id = auth.uid())';
  END LOOP;
  
  FOR partition_table IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'analytics' AND 
          tablename LIKE 'interactions_p2026_%' AND
          tablename NOT LIKE '%\_p\_%'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "service_role_all" ON analytics.' || partition_table;
    EXECUTE 'CREATE POLICY "' || partition_table || '_service_role_policy" ON analytics.' || partition_table || 
           ' AS PERMISSIVE FOR ALL TO service_role USING (true)';
    EXECUTE 'CREATE POLICY "' || partition_table || '_admin_policy" ON analytics.' || partition_table || 
           ' AS PERMISSIVE FOR ALL TO authenticated USING (public.is_admin())'; -- Changed here
    EXECUTE 'CREATE POLICY "' || partition_table || '_assistant_owner_policy" ON analytics.' || partition_table || 
           ' AS PERMISSIVE FOR SELECT TO authenticated USING (auth.owns_assistant(assistant_id))';
    EXECUTE 'CREATE POLICY "' || partition_table || '_user_own_data_policy" ON analytics.' || partition_table || 
           ' AS PERMISSIVE FOR SELECT TO authenticated USING (user_id = auth.uid())';
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."apply_partition_policies"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_audit_logs"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    DELETE FROM public.audit_logs
    WHERE action_timestamp < NOW() - INTERVAL '90 days';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table public.audit_logs does not exist yet';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning up audit logs: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_audit_logs"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_old_audit_logs"() IS 'Removes audit logs older than 90 days - runs weekly';



CREATE OR REPLACE FUNCTION "public"."complete_file_processing"("p_file_id" "uuid", "p_vector_count" integer, "p_status" "text" DEFAULT 'ready'::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_assistant_id UUID;
    v_result BOOLEAN;
BEGIN
    -- Update file status
    UPDATE "assistants"."assistant_files"
    SET "status" = p_status,
        "vector_count" = p_vector_count,
        "updated_at" = NOW()
    WHERE "id" = p_file_id
    RETURNING TRUE INTO v_result;
    
    -- Update assistant activity to increment document count
    SELECT "assistant_id" INTO v_assistant_id
    FROM "assistants"."assistant_files"
    WHERE "id" = p_file_id;
    
    IF v_assistant_id IS NOT NULL THEN
        UPDATE "assistants"."assistant_activity"
        SET "total_documents" = "total_documents" + 1,
            "updated_at" = NOW()
        WHERE "assistant_id" = v_assistant_id;
    END IF;
    
    RETURN COALESCE(v_result, FALSE);
END;
$$;


ALTER FUNCTION "public"."complete_file_processing"("p_file_id" "uuid", "p_vector_count" integer, "p_status" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."complete_file_processing"("p_file_id" "uuid", "p_vector_count" integer, "p_status" "text") IS 'Mark file processing as complete and update assistant document count';



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


ALTER FUNCTION "public"."ensure_partition_exists"("year_month" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_interaction"("p_assistant_id" "uuid", "p_user_id" "uuid", "p_request" "text", "p_response" "text", "p_interaction_time" timestamp with time zone DEFAULT "now"(), "p_chat" "text" DEFAULT NULL::"text", "p_is_error" boolean DEFAULT false, "p_token_usage" integer DEFAULT 0, "p_input_tokens" integer DEFAULT 0, "p_output_tokens" integer DEFAULT 0, "p_duration" integer DEFAULT 0, "p_cost_estimate" numeric DEFAULT NULL::numeric) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    new_id uuid := gen_random_uuid();
BEGIN
    INSERT INTO analytics.interactions_shadow (
        id, assistant_id, user_id, request, response, interaction_time,
        chat, is_error, token_usage, input_tokens, output_tokens,
        duration, cost_estimate
    ) VALUES (
        new_id, p_assistant_id, p_user_id, p_request, p_response, p_interaction_time,
        p_chat, p_is_error, p_token_usage, p_input_tokens, p_output_tokens,
        p_duration, p_cost_estimate
    );
    
    RETURN new_id;
END;
$$;


ALTER FUNCTION "public"."insert_interaction"("p_assistant_id" "uuid", "p_user_id" "uuid", "p_request" "text", "p_response" "text", "p_interaction_time" timestamp with time zone, "p_chat" "text", "p_is_error" boolean, "p_token_usage" integer, "p_input_tokens" integer, "p_output_tokens" integer, "p_duration" integer, "p_cost_estimate" numeric) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."insert_interaction"("p_assistant_id" "uuid", "p_user_id" "uuid", "p_request" "text", "p_response" "text", "p_interaction_time" timestamp with time zone, "p_chat" "text", "p_is_error" boolean, "p_token_usage" integer, "p_input_tokens" integer, "p_output_tokens" integer, "p_duration" integer, "p_cost_estimate" numeric) IS 'Helper function to insert interactions. This will automatically route to the appropriate partition.
Use this function instead of inserting directly into the tables.';



CREATE OR REPLACE FUNCTION "public"."insert_interaction_metrics"("p_interaction_id" "uuid", "p_input_tokens" integer DEFAULT 0, "p_output_tokens" integer DEFAULT 0, "p_cost_estimate" numeric DEFAULT 0, "p_response_time_ms" integer DEFAULT NULL::integer, "p_ai_model" "text" DEFAULT NULL::"text", "p_client_info" "jsonb" DEFAULT NULL::"jsonb", "p_sentiment_score" integer DEFAULT NULL::integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO analytics.interaction_metrics (
        interaction_id, input_tokens, output_tokens, total_tokens,
        cost_estimate, response_time_ms, ai_model, client_info, sentiment_score
    ) VALUES (
        p_interaction_id, p_input_tokens, p_output_tokens, (p_input_tokens + p_output_tokens),
        p_cost_estimate, p_response_time_ms, p_ai_model, p_client_info, p_sentiment_score
    );
END;
$$;


ALTER FUNCTION "public"."insert_interaction_metrics"("p_interaction_id" "uuid", "p_input_tokens" integer, "p_output_tokens" integer, "p_cost_estimate" numeric, "p_response_time_ms" integer, "p_ai_model" "text", "p_client_info" "jsonb", "p_sentiment_score" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."insert_interaction_metrics"("p_interaction_id" "uuid", "p_input_tokens" integer, "p_output_tokens" integer, "p_cost_estimate" numeric, "p_response_time_ms" integer, "p_ai_model" "text", "p_client_info" "jsonb", "p_sentiment_score" integer) IS 'Helper function to insert interaction metrics associated with an interaction.';



CREATE OR REPLACE FUNCTION "public"."interactions_insert_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    _monthly_period text;
BEGIN
    -- Calculate monthly period once to avoid repetition
    _monthly_period := to_char(NEW.interaction_time, 'YYYY_MM');
    
    -- Use prepared statement approach for better performance
    INSERT INTO analytics.interactions (
        id, assistant_id, user_id, interaction_time, request, response, 
        token_usage, input_tokens, output_tokens, cost_estimate, duration,
        chat, monthly_period, is_error, created_at, updated_at
    ) VALUES (
        NEW.id, 
        NEW.assistant_id, 
        NEW.user_id, 
        NEW.interaction_time, 
        NEW.request, 
        NEW.response,
        COALESCE(NEW.token_usage, 0), 
        COALESCE(NEW.input_tokens, 0), 
        COALESCE(NEW.output_tokens, 0), 
        COALESCE(NEW.cost_estimate, 0), 
        COALESCE(NEW.duration, 0),
        NEW.chat, 
        _monthly_period, 
        COALESCE(NEW.is_error, false),
        NEW.created_at, 
        NEW.updated_at
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't prevent record creation
        RAISE WARNING 'Error in interactions_insert_trigger: %', SQLERRM;
        RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."interactions_insert_trigger"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."interactions_insert_trigger"() IS 'Optimized trigger function for inserting interaction records into analytics schema';



CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
    FALSE
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_admin"() IS 'Checks if the authenticated user has is_admin = TRUE in the users.users table.';



CREATE OR REPLACE FUNCTION "public"."provision_twilio_number"("p_phone_number" "text", "p_twilio_sid" "text", "p_friendly_name" "text" DEFAULT NULL::"text", "p_country" "text" DEFAULT 'US'::"text", "p_region" "text" DEFAULT NULL::"text", "p_capabilities" "jsonb" DEFAULT '{"sms": true, "voice": true}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_phone_id UUID;
BEGIN
    -- Ensure phone number format
    IF NOT p_phone_number LIKE '+%' THEN
        p_phone_number := '+' || p_phone_number;
    END IF;
    
    -- Insert phone number record
    INSERT INTO "public"."phone_numbers" (
        "phone_number",
        "twilio_sid",
        "friendly_name",
        "country",
        "region",
        "capabilities",
        "is_assigned"
    ) VALUES (
        p_phone_number,
        p_twilio_sid,
        p_friendly_name,
        p_country,
        p_region,
        p_capabilities,
        FALSE
    ) RETURNING "id" INTO v_phone_id;
    
    RETURN v_phone_id;
END;
$$;


ALTER FUNCTION "public"."provision_twilio_number"("p_phone_number" "text", "p_twilio_sid" "text", "p_friendly_name" "text", "p_country" "text", "p_region" "text", "p_capabilities" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."provision_twilio_number"("p_phone_number" "text", "p_twilio_sid" "text", "p_friendly_name" "text", "p_country" "text", "p_region" "text", "p_capabilities" "jsonb") IS 'Provision a new Twilio phone number in the system';



CREATE OR REPLACE FUNCTION "public"."refresh_materialized_views"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Check if the materialized views exist before refreshing
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'analytics' AND matviewname = 'mv_daily_activity_summary') THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.mv_daily_activity_summary;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'analytics' AND matviewname = 'mv_user_activity_timeline') THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.mv_user_activity_timeline;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error refreshing materialized views: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."refresh_materialized_views"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."refresh_materialized_views"() IS 'Refreshes all analytics materialized views - scheduled to run daily';



CREATE OR REPLACE FUNCTION "public"."route_interaction_to_partition"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
    target_partition text;
    year_month text;
BEGIN
    -- Calculate which partition this should go to based on interaction_time
    year_month := to_char(NEW.interaction_time, 'YYYY_MM');
    
    -- Set the monthly_period if it's not already set
    IF NEW.monthly_period IS NULL THEN
        NEW.monthly_period := year_month;
    END IF;
    
    -- Ensure the partition exists
    PERFORM analytics.ensure_partition_exists(year_month);
    
    -- Determine target partition name
    target_partition := 'interactions_p' || year_month;
    
    -- Insert data into the appropriate partition
    EXECUTE format('
        INSERT INTO analytics.%I (
            id, assistant_id, user_id, interaction_time, request, response,
            token_usage, input_tokens, output_tokens, cost_estimate,
            duration, chat, monthly_period, is_error, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    ', target_partition)
    USING 
        NEW.id, NEW.assistant_id, NEW.user_id, NEW.interaction_time, NEW.request, NEW.response,
        NEW.token_usage, NEW.input_tokens, NEW.output_tokens, NEW.cost_estimate,
        NEW.duration, NEW.chat, NEW.monthly_period, NEW.is_error, NEW.created_at, NEW.updated_at;
    
    -- Also insert into the main interactions table for backward compatibility
    INSERT INTO analytics.interactions (
        id, assistant_id, user_id, interaction_time, request, response,
        token_usage, input_tokens, output_tokens, cost_estimate,
        duration, chat, monthly_period, is_error, created_at, updated_at
    ) VALUES (
        NEW.id, NEW.assistant_id, NEW.user_id, NEW.interaction_time, NEW.request, NEW.response,
        NEW.token_usage, NEW.input_tokens, NEW.output_tokens, NEW.cost_estimate,
        NEW.duration, NEW.chat, NEW.monthly_period, NEW.is_error, NEW.created_at, NEW.updated_at
    );
    
    -- Return NULL to prevent insertion into shadow table (we've already routed it)
    RETURN NULL;
END;
$_$;


ALTER FUNCTION "public"."route_interaction_to_partition"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_file_metadata"("p_assistant_id" "uuid", "p_query" "text", "p_limit" integer DEFAULT 10) RETURNS TABLE("file_id" "uuid", "pinecone_id" "text", "file_name" "text", "file_type" "text", "created_at" timestamp with time zone, "status" "text", "relevance" double precision)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- This is a metadata-only search function
    -- The actual vector search would be performed by an external service
    
    -- Return files based on simple text matching for demonstration
    RETURN QUERY
    SELECT 
        af.id AS file_id,
        af.pinecone_id,
        af.name AS file_name,
        af.file_type,
        af.created_at,
        af.status,
        -- Simple relevance scoring based on text similarity
        -- In a real implementation, this would use vector similarity from Pinecone
        similarity(af.name, p_query) AS relevance
    FROM "assistants"."assistant_files" af
    WHERE af.assistant_id = p_assistant_id
    AND (
        af.name ILIKE '%' || p_query || '%' OR
        EXISTS (
            SELECT 1 
            FROM "assistants"."file_chunks" fc
            WHERE fc.file_id = af.id 
            AND fc.chunk_text ILIKE '%' || p_query || '%'
        )
    )
    ORDER BY relevance DESC
    LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."search_file_metadata"("p_assistant_id" "uuid", "p_query" "text", "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."search_file_metadata"("p_assistant_id" "uuid", "p_query" "text", "p_limit" integer) IS 'Search for file metadata based on text query (placeholder for vector search)';



CREATE OR REPLACE FUNCTION "public"."update_payment_sessions_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_payment_sessions_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_twilio_webhooks"("p_phone_id" "uuid", "p_voice_url" "text" DEFAULT NULL::"text", "p_sms_url" "text" DEFAULT NULL::"text", "p_sms_fallback_url" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_result BOOLEAN;
BEGIN
    UPDATE "public"."phone_numbers"
    SET "voice_url" = COALESCE(p_voice_url, "voice_url"),
        "sms_url" = COALESCE(p_sms_url, "sms_url"),
        "sms_fallback_url" = COALESCE(p_sms_fallback_url, "sms_fallback_url"),
        "updated_at" = NOW()
    WHERE "id" = p_phone_id
    RETURNING TRUE INTO v_result;
    
    RETURN COALESCE(v_result, FALSE);
END;
$$;


ALTER FUNCTION "public"."update_twilio_webhooks"("p_phone_id" "uuid", "p_voice_url" "text", "p_sms_url" "text", "p_sms_fallback_url" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_twilio_webhooks"("p_phone_id" "uuid", "p_voice_url" "text", "p_sms_url" "text", "p_sms_fallback_url" "text") IS 'Update Twilio webhook URLs for a phone number';



CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upload_file_to_pinecone"("p_assistant_id" "uuid", "p_file_name" "text", "p_file_type" "text", "p_file_size" integer, "p_file_content" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_file_id UUID;
    v_pinecone_id TEXT;
    v_pinecone_namespace TEXT;
    v_result JSONB;
    v_index_name TEXT;
BEGIN
    -- Get the Pinecone index name from assistant_configs
    SELECT pinecone_name INTO v_index_name
    FROM "assistants"."assistant_configs"
    WHERE assistant_id = p_assistant_id;
    
    -- If no index name is found, use the default format
    IF v_index_name IS NULL THEN
        v_index_name := 'pinecone-' || p_assistant_id::TEXT;
        
        -- Update the assistant_configs with the index name
        UPDATE "assistants"."assistant_configs"
        SET pinecone_name = v_index_name
        WHERE assistant_id = p_assistant_id;
    END IF;
    
    -- Generate unique IDs
    v_pinecone_id := 'file-' || uuid_generate_v4()::TEXT;
    v_pinecone_namespace := 'files-' || p_assistant_id::TEXT;
    
    -- Insert file record
    INSERT INTO "assistants"."assistant_files" (
        "assistant_id",
        "name",
        "status",
        "pinecone_id",
        "pinecone_namespace",
        "file_size",
        "file_type",
        "metadata"
    ) VALUES (
        p_assistant_id,
        p_file_name,
        'processing', -- Will be updated to 'ready' after processing
        v_pinecone_id,
        v_pinecone_namespace,
        p_file_size,
        p_file_type,
        jsonb_build_object(
            'uploaded_at', now(),
            'original_name', p_file_name
        )
    ) RETURNING "id" INTO v_file_id;
    
    -- The actual file processing and chunking will be handled by an external service
    -- This function just creates the initial record
    
    -- Return file information
    SELECT jsonb_build_object(
        'file_id', v_file_id,
        'pinecone_id', v_pinecone_id,
        'pinecone_namespace', v_pinecone_namespace,
        'index_name', v_index_name
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."upload_file_to_pinecone"("p_assistant_id" "uuid", "p_file_name" "text", "p_file_type" "text", "p_file_size" integer, "p_file_content" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."upload_file_to_pinecone"("p_assistant_id" "uuid", "p_file_name" "text", "p_file_type" "text", "p_file_size" integer, "p_file_content" "text") IS 'Create a file record for Pinecone storage and return metadata';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."assistant_activity" (
    "assistant_id" "uuid" NOT NULL,
    "total_messages" integer DEFAULT 0,
    "total_tokens" integer DEFAULT 0,
    "total_documents" integer DEFAULT 0,
    "total_webpages" integer DEFAULT 0,
    "last_message_at" timestamp with time zone,
    "last_used_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_activity_at" timestamp with time zone,
    "total_interactions" integer
);


ALTER TABLE "public"."assistant_activity" OWNER TO "postgres";


COMMENT ON COLUMN "public"."assistant_activity"."assistant_id" IS 'Foreign key reference to the assistants table. Uniquely identifies the assistant.';



COMMENT ON COLUMN "public"."assistant_activity"."total_messages" IS 'Total count of messages exchanged with this assistant.';



COMMENT ON COLUMN "public"."assistant_activity"."total_tokens" IS 'Total count of AI tokens consumed by this assistant across all interactions.';



COMMENT ON COLUMN "public"."assistant_activity"."total_documents" IS 'Total count of documents uploaded or processed by this assistant.';



COMMENT ON COLUMN "public"."assistant_activity"."total_webpages" IS 'Total count of web pages processed by this assistant.';



COMMENT ON COLUMN "public"."assistant_activity"."last_message_at" IS 'Timestamp of the last message sent to or received from this assistant.';



COMMENT ON COLUMN "public"."assistant_activity"."last_used_at" IS 'Timestamp of the last interaction with this assistant.';



COMMENT ON COLUMN "public"."assistant_activity"."created_at" IS 'Timestamp when the activity record was first created.';



COMMENT ON COLUMN "public"."assistant_activity"."updated_at" IS 'Timestamp when the activity record was last updated.';



CREATE TABLE IF NOT EXISTS "public"."assistant_configs" (
    "id" "uuid" NOT NULL,
    "description" "text",
    "display_name" "text",
    "personality" "text",
    "business_name" "text",
    "business_phone" "text",
    "system_prompt" "text",
    "pinecone_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "concierge_name" "text",
    "share_phone_number" boolean DEFAULT false
);


ALTER TABLE "public"."assistant_configs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."assistant_configs"."id" IS 'Primary key, matches the corresponding assistant ID.';



COMMENT ON COLUMN "public"."assistant_configs"."description" IS 'Brief description of the assistant or its purpose.';



COMMENT ON COLUMN "public"."assistant_configs"."display_name" IS 'Display name for the concierge assistant.';



COMMENT ON COLUMN "public"."assistant_configs"."personality" IS 'Personality traits or characteristics for the assistant to exhibit.';



COMMENT ON COLUMN "public"."assistant_configs"."business_name" IS 'Name of the business the assistant represents.';



COMMENT ON COLUMN "public"."assistant_configs"."business_phone" IS 'Contact phone number for the business.';



COMMENT ON COLUMN "public"."assistant_configs"."system_prompt" IS 'System prompt used to define the assistant behavior and context.';



COMMENT ON COLUMN "public"."assistant_configs"."pinecone_name" IS 'Name of the Pinecone index used for vector storage.';



COMMENT ON COLUMN "public"."assistant_configs"."created_at" IS 'Timestamp when the config record was first created.';



COMMENT ON COLUMN "public"."assistant_configs"."updated_at" IS 'Timestamp when the config record was last updated.';



COMMENT ON COLUMN "public"."assistant_configs"."concierge_name" IS 'Display name for the concierge assistant, used in conversations and interactions.';



COMMENT ON COLUMN "public"."assistant_configs"."share_phone_number" IS 'Boolean flag indicating whether the assistant should share its phone number with users.';



CREATE TABLE IF NOT EXISTS "public"."assistant_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assistant_id" "uuid" NOT NULL,
    "plan_id" "text" NOT NULL,
    "stripe_subscription_id" "text",
    "status" "text" NOT NULL,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "cancel_at_period_end" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "payment_session_id" "uuid"
);


ALTER TABLE "public"."assistant_subscriptions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."assistant_subscriptions"."id" IS 'Unique identifier for the subscription record.';



COMMENT ON COLUMN "public"."assistant_subscriptions"."assistant_id" IS 'Foreign key reference to the assistants table. Identifies the subscribed assistant.';



COMMENT ON COLUMN "public"."assistant_subscriptions"."plan_id" IS 'Foreign key reference to the subscription_plans table. Identifies the subscription plan.';



COMMENT ON COLUMN "public"."assistant_subscriptions"."stripe_subscription_id" IS 'Stripe subscription ID for payment processing integration.';



COMMENT ON COLUMN "public"."assistant_subscriptions"."status" IS 'Current status of the subscription (e.g., active, canceled, past_due).';



COMMENT ON COLUMN "public"."assistant_subscriptions"."current_period_start" IS 'Timestamp when the current billing period started.';



COMMENT ON COLUMN "public"."assistant_subscriptions"."current_period_end" IS 'Timestamp when the current billing period ends.';



COMMENT ON COLUMN "public"."assistant_subscriptions"."cancel_at_period_end" IS 'Boolean flag indicating whether the subscription will cancel at the end of the current period.';



COMMENT ON COLUMN "public"."assistant_subscriptions"."created_at" IS 'Timestamp when the subscription record was first created.';



COMMENT ON COLUMN "public"."assistant_subscriptions"."updated_at" IS 'Timestamp when the subscription record was last updated.';



CREATE TABLE IF NOT EXISTS "public"."assistant_usage_limits" (
    "assistant_id" "uuid" NOT NULL,
    "message_limit" integer DEFAULT 100,
    "token_limit" integer DEFAULT 100000,
    "document_limit" integer DEFAULT 5,
    "webpage_limit" integer DEFAULT 5,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "max_messages" integer,
    "max_tokens" integer
);


ALTER TABLE "public"."assistant_usage_limits" OWNER TO "postgres";


COMMENT ON COLUMN "public"."assistant_usage_limits"."assistant_id" IS 'Foreign key reference to the assistants table. Uniquely identifies the assistant.';



COMMENT ON COLUMN "public"."assistant_usage_limits"."message_limit" IS 'Maximum number of messages that can be exchanged with the assistant.';



COMMENT ON COLUMN "public"."assistant_usage_limits"."token_limit" IS 'Maximum number of AI tokens that can be consumed by the assistant.';



COMMENT ON COLUMN "public"."assistant_usage_limits"."document_limit" IS 'Maximum number of documents that can be stored or processed by the assistant.';



COMMENT ON COLUMN "public"."assistant_usage_limits"."webpage_limit" IS 'Maximum number of web pages that can be processed by the assistant.';



COMMENT ON COLUMN "public"."assistant_usage_limits"."created_at" IS 'Timestamp when the usage limits record was first created.';



COMMENT ON COLUMN "public"."assistant_usage_limits"."updated_at" IS 'Timestamp when the usage limits record was last updated.';



CREATE TABLE IF NOT EXISTS "public"."assistants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "is_starred" boolean DEFAULT false,
    "pending" boolean DEFAULT false,
    "assigned_phone_number" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."assistants" OWNER TO "postgres";


COMMENT ON COLUMN "public"."assistants"."id" IS 'Primary key, unique identifier for the assistant.';



COMMENT ON COLUMN "public"."assistants"."user_id" IS 'Foreign key reference to the users table. Identifies the owner of the assistant.';



COMMENT ON COLUMN "public"."assistants"."name" IS 'Name of the assistant (internal identifier, not necessarily displayed to users).';



COMMENT ON COLUMN "public"."assistants"."is_starred" IS 'Boolean flag indicating whether the assistant is marked as a favorite.';



COMMENT ON COLUMN "public"."assistants"."pending" IS 'Boolean flag indicating whether the assistant is in a pending/setup state.';



COMMENT ON COLUMN "public"."assistants"."assigned_phone_number" IS 'Phone number assigned to this assistant for SMS/voice communication.';



COMMENT ON COLUMN "public"."assistants"."created_at" IS 'Timestamp when the assistant was first created.';



COMMENT ON COLUMN "public"."assistants"."updated_at" IS 'Timestamp when the assistant record was last updated.';



CREATE OR REPLACE VIEW "public"."assistant_detail_view" AS
 SELECT "a"."id",
    "a"."name" AS "assistant_name",
    "a"."user_id",
    "a"."created_at" AS "assistant_created_at",
    "a"."updated_at" AS "assistant_updated_at",
    "ac"."system_prompt",
    "ac"."description",
    "ac"."business_name",
    "ac"."pinecone_name",
    "ac"."display_name",
    "ac"."personality",
    "ac"."created_at" AS "config_created_at",
    "ac"."updated_at" AS "config_updated_at",
    "act"."last_activity_at",
    "act"."total_interactions",
    "sub"."plan_id",
    "sub"."status" AS "subscription_status",
    "sub"."current_period_end",
    "lim"."max_messages",
    "lim"."max_tokens"
   FROM (((("public"."assistants" "a"
     LEFT JOIN "public"."assistant_configs" "ac" ON (("a"."id" = "ac"."id")))
     LEFT JOIN "public"."assistant_activity" "act" ON (("a"."id" = "act"."assistant_id")))
     LEFT JOIN "public"."assistant_subscriptions" "sub" ON (("a"."id" = "sub"."assistant_id")))
     LEFT JOIN "public"."assistant_usage_limits" "lim" ON (("a"."id" = "lim"."assistant_id")));


ALTER TABLE "public"."assistant_detail_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "entity_type" "text" NOT NULL,
    "action" "text" NOT NULL,
    "action_timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "performed_by" "uuid" NOT NULL,
    "details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "related_entity_id" "uuid"
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."audit_logs" IS 'Tracks important system changes including role assignments';



COMMENT ON COLUMN "public"."audit_logs"."related_entity_id" IS 'Optional reference to a related entity in the action being logged';



CREATE TABLE IF NOT EXISTS "public"."interaction_metrics" (
    "interaction_id" "uuid" NOT NULL,
    "input_tokens" integer DEFAULT 0,
    "output_tokens" integer DEFAULT 0,
    "total_tokens" integer DEFAULT 0,
    "cost_estimate" numeric(10,4) DEFAULT 0,
    "response_time_ms" integer,
    "ai_model" "text",
    "client_info" "jsonb",
    "sentiment_score" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."interaction_metrics" OWNER TO "postgres";


COMMENT ON TABLE "public"."interaction_metrics" IS 'Detailed metrics about assistant interactions, migrated from public schema';



CREATE TABLE IF NOT EXISTS "public"."interactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "assistant_id" "uuid",
    "user_id" "uuid",
    "request" "text" NOT NULL,
    "response" "text" NOT NULL,
    "interaction_time" timestamp with time zone DEFAULT "now"(),
    "chat" "text",
    "is_error" boolean DEFAULT false,
    "token_usage" integer DEFAULT 0,
    "input_tokens" integer DEFAULT 0,
    "output_tokens" integer DEFAULT 0,
    "duration" integer DEFAULT 0,
    "monthly_period" "text",
    "cost_estimate" numeric(10,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."interactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."interactions" IS 'New interactions table in analytics schema';



CREATE TABLE IF NOT EXISTS "public"."interactions_shadow" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assistant_id" "uuid",
    "user_id" "uuid",
    "request" "text" NOT NULL,
    "response" "text" NOT NULL,
    "interaction_time" timestamp with time zone DEFAULT "now"(),
    "chat" "text",
    "is_error" boolean DEFAULT false,
    "token_usage" integer DEFAULT 0,
    "input_tokens" integer DEFAULT 0,
    "output_tokens" integer DEFAULT 0,
    "duration" integer DEFAULT 0,
    "monthly_period" "text",
    "cost_estimate" numeric(10,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."interactions_shadow" OWNER TO "postgres";


COMMENT ON TABLE "public"."interactions_shadow" IS 'Shadow table for interactions. Insert data here instead of directly into partitions.
The trigger will automatically route data to the appropriate monthly partition.
If the partition doesn''t exist, it will be created automatically.';



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "type" "text" NOT NULL,
    "read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "notifications_type_check" CHECK (("type" = ANY (ARRAY['info'::"text", 'warning'::"text", 'error'::"text", 'success'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "text" NOT NULL,
    "user_id" "uuid",
    "assistant_config_data" "jsonb" NOT NULL,
    "stripe_checkout_session_id" "text",
    "stripe_customer_id" "text",
    "plan_id" "text",
    "amount_total" integer,
    "currency" "text" DEFAULT 'usd'::"text",
    "customer_email" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    CONSTRAINT "payment_sessions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'expired'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."payment_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."phone_numbers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "phone_number" "text" NOT NULL,
    "assistant_id" "uuid",
    "country" "text",
    "status" "text" DEFAULT 'available'::"text",
    "is_assigned" boolean DEFAULT false,
    "capabilities" "jsonb" DEFAULT '{"mms": false, "sms": true, "voice": true}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "twilio_sid" "text",
    "messaging_service_sid" "text",
    "voice_url" "text",
    "sms_url" "text",
    "sms_fallback_url" "text"
);

ALTER TABLE ONLY "public"."phone_numbers" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."phone_numbers" OWNER TO "postgres";


COMMENT ON TABLE "public"."phone_numbers" IS 'Inventory of available phone numbers for assistants';



COMMENT ON COLUMN "public"."phone_numbers"."id" IS 'Primary key, unique identifier for the phone number record.';



COMMENT ON COLUMN "public"."phone_numbers"."phone_number" IS 'The actual phone number in E.164 format.';



COMMENT ON COLUMN "public"."phone_numbers"."assistant_id" IS 'Foreign key reference to the assistants table. Identifies which assistant this number is assigned to, if any.';



COMMENT ON COLUMN "public"."phone_numbers"."country" IS 'Country code for this phone number.';



COMMENT ON COLUMN "public"."phone_numbers"."status" IS 'Current status of the phone number (e.g., active, inactive, pending).';



COMMENT ON COLUMN "public"."phone_numbers"."is_assigned" IS 'Boolean flag indicating whether the number is currently assigned to an assistant.';



COMMENT ON COLUMN "public"."phone_numbers"."capabilities" IS 'JSON object describing the capabilities of this number (SMS, voice, MMS, etc.).';



COMMENT ON COLUMN "public"."phone_numbers"."created_at" IS 'Timestamp when the phone number record was first created.';



COMMENT ON COLUMN "public"."phone_numbers"."updated_at" IS 'Timestamp when the phone number record was last updated.';



CREATE TABLE IF NOT EXISTS "public"."usage_statistics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "entity_type" "text" NOT NULL,
    "period" "date",
    "messages_count" integer DEFAULT 0,
    "interactions_count" integer DEFAULT 0,
    "token_usage" integer DEFAULT 0,
    "input_tokens" integer DEFAULT 0,
    "output_tokens" integer DEFAULT 0,
    "cost_estimate" numeric(10,4) DEFAULT 0,
    "last_activity" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "usage_statistics_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['assistant'::"text", 'user'::"text"])))
);

ALTER TABLE ONLY "public"."usage_statistics" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."usage_statistics" OWNER TO "postgres";


COMMENT ON TABLE "public"."usage_statistics" IS 'Aggregated usage statistics for users and assistants';



COMMENT ON COLUMN "public"."usage_statistics"."id" IS 'Primary key, unique identifier for the usage statistics record.';



COMMENT ON COLUMN "public"."usage_statistics"."entity_id" IS 'ID of the entity (user, assistant, etc.) these statistics apply to.';



COMMENT ON COLUMN "public"."usage_statistics"."entity_type" IS 'Type of entity (user, assistant, organization, etc.) these statistics apply to.';



COMMENT ON COLUMN "public"."usage_statistics"."period" IS 'Time period these statistics cover (e.g., day, week, month, year).';



COMMENT ON COLUMN "public"."usage_statistics"."messages_count" IS 'Total count of messages exchanged during this period.';



COMMENT ON COLUMN "public"."usage_statistics"."interactions_count" IS 'Total count of interactions during this period.';



COMMENT ON COLUMN "public"."usage_statistics"."token_usage" IS 'Total token count (input + output) for this period.';



COMMENT ON COLUMN "public"."usage_statistics"."input_tokens" IS 'Total number of input tokens used during this period.';



COMMENT ON COLUMN "public"."usage_statistics"."output_tokens" IS 'Total number of output tokens generated during this period.';



COMMENT ON COLUMN "public"."usage_statistics"."cost_estimate" IS 'Estimated cost in USD for usage during this period.';



COMMENT ON COLUMN "public"."usage_statistics"."last_activity" IS 'Timestamp of the last activity in this period.';



COMMENT ON COLUMN "public"."usage_statistics"."created_at" IS 'Timestamp when the statistics record was first created.';



COMMENT ON COLUMN "public"."usage_statistics"."updated_at" IS 'Timestamp when the statistics record was last updated.';



ALTER TABLE ONLY "public"."assistant_activity"
    ADD CONSTRAINT "assistant_activity_pkey" PRIMARY KEY ("assistant_id");



ALTER TABLE ONLY "public"."assistant_configs"
    ADD CONSTRAINT "assistant_configs_pinecone_name_key" UNIQUE ("pinecone_name");



ALTER TABLE ONLY "public"."assistant_configs"
    ADD CONSTRAINT "assistant_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assistant_subscriptions"
    ADD CONSTRAINT "assistant_subscriptions_assistant_id_key" UNIQUE ("assistant_id");



ALTER TABLE ONLY "public"."assistant_subscriptions"
    ADD CONSTRAINT "assistant_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assistant_subscriptions"
    ADD CONSTRAINT "assistant_subscriptions_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id");



ALTER TABLE ONLY "public"."assistant_usage_limits"
    ADD CONSTRAINT "assistant_usage_limits_pkey" PRIMARY KEY ("assistant_id");



ALTER TABLE ONLY "public"."assistants"
    ADD CONSTRAINT "assistants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interaction_metrics"
    ADD CONSTRAINT "interaction_metrics_pkey" PRIMARY KEY ("interaction_id");



ALTER TABLE ONLY "public"."interactions"
    ADD CONSTRAINT "interactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_sessions"
    ADD CONSTRAINT "payment_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_sessions"
    ADD CONSTRAINT "payment_sessions_session_id_key" UNIQUE ("session_id");



ALTER TABLE ONLY "public"."phone_numbers"
    ADD CONSTRAINT "phone_numbers_phone_number_key" UNIQUE ("phone_number");



ALTER TABLE ONLY "public"."phone_numbers"
    ADD CONSTRAINT "phone_numbers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."usage_statistics"
    ADD CONSTRAINT "usage_statistics_entity_period_unique" UNIQUE ("entity_id", "entity_type", "period");



ALTER TABLE ONLY "public"."usage_statistics"
    ADD CONSTRAINT "usage_statistics_pkey" PRIMARY KEY ("id");



CREATE INDEX "assistant_activity_last_message_at_idx" ON "public"."assistant_activity" USING "btree" ("last_message_at" DESC);



CREATE INDEX "assistant_activity_last_used_at_idx" ON "public"."assistant_activity" USING "btree" ("last_used_at");



CREATE INDEX "assistant_activity_last_used_at_idx1" ON "public"."assistant_activity" USING "btree" ("last_used_at" DESC);



CREATE INDEX "assistant_configs_business_name_idx" ON "public"."assistant_configs" USING "btree" ("business_name");



CREATE INDEX "assistant_subscriptions_status_idx" ON "public"."assistant_subscriptions" USING "btree" ("status");



CREATE INDEX "assistants_name_idx" ON "public"."assistants" USING "btree" ("name");



CREATE INDEX "assistants_pending_idx" ON "public"."assistants" USING "btree" ("pending") WHERE ("pending" = true);



CREATE INDEX "assistants_user_id_created_at_idx" ON "public"."assistants" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "assistants_user_id_idx" ON "public"."assistants" USING "btree" ("user_id");



CREATE INDEX "audit_logs_entity_action_idx" ON "public"."audit_logs" USING "btree" ("entity_type", "entity_id", "action_timestamp" DESC);



CREATE INDEX "audit_logs_performer_idx" ON "public"."audit_logs" USING "btree" ("performed_by", "action_timestamp" DESC);



CREATE INDEX "idx_analytics_interaction_metrics_cost_estimate" ON "public"."interaction_metrics" USING "btree" ("cost_estimate");



CREATE INDEX "idx_analytics_interaction_metrics_created_at" ON "public"."interaction_metrics" USING "btree" ("created_at");



CREATE INDEX "idx_analytics_interaction_metrics_model" ON "public"."interaction_metrics" USING "btree" ("ai_model");



CREATE INDEX "idx_analytics_interaction_metrics_total_tokens" ON "public"."interaction_metrics" USING "btree" ("total_tokens");



CREATE INDEX "idx_analytics_interactions_assistant_id" ON "public"."interactions" USING "btree" ("assistant_id");



CREATE INDEX "idx_analytics_interactions_interaction_time" ON "public"."interactions" USING "btree" ("interaction_time" DESC);



CREATE INDEX "idx_analytics_interactions_monthly_period" ON "public"."interactions" USING "btree" ("monthly_period");



CREATE INDEX "idx_analytics_interactions_user_id" ON "public"."interactions" USING "btree" ("user_id");



CREATE INDEX "idx_assistant_activity_assistant_id" ON "public"."assistant_activity" USING "btree" ("assistant_id");



CREATE INDEX "idx_assistant_configs_id" ON "public"."assistant_configs" USING "btree" ("id");



CREATE INDEX "idx_assistant_subscriptions_assistant_id" ON "public"."assistant_subscriptions" USING "btree" ("assistant_id");



CREATE INDEX "idx_assistant_subscriptions_payment_session" ON "public"."assistant_subscriptions" USING "btree" ("payment_session_id");



CREATE INDEX "idx_assistant_usage_limits_assistant_id" ON "public"."assistant_usage_limits" USING "btree" ("assistant_id");



CREATE INDEX "idx_payment_sessions_created_at" ON "public"."payment_sessions" USING "btree" ("created_at");



CREATE INDEX "idx_payment_sessions_expires_at" ON "public"."payment_sessions" USING "btree" ("expires_at");



CREATE INDEX "idx_payment_sessions_session_id" ON "public"."payment_sessions" USING "btree" ("session_id");



CREATE INDEX "idx_payment_sessions_status" ON "public"."payment_sessions" USING "btree" ("status");



CREATE INDEX "idx_payment_sessions_user_id" ON "public"."payment_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_phone_numbers_is_assigned" ON "public"."phone_numbers" USING "btree" ("is_assigned");



CREATE INDEX "idx_phone_numbers_phone_number" ON "public"."phone_numbers" USING "btree" ("phone_number");



CREATE INDEX "idx_phone_numbers_status" ON "public"."phone_numbers" USING "btree" ("status");



CREATE INDEX "idx_phone_numbers_unassigned" ON "public"."phone_numbers" USING "btree" ("id", "created_at") WHERE ("is_assigned" = false);



CREATE INDEX "idx_usage_statistics_entity" ON "public"."usage_statistics" USING "btree" ("entity_id", "entity_type");



CREATE INDEX "idx_usage_statistics_entity_type_entity_id" ON "public"."usage_statistics" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_usage_statistics_period" ON "public"."usage_statistics" USING "btree" ("period");



CREATE INDEX "idx_usage_statistics_period_entity_type" ON "public"."usage_statistics" USING "btree" ("period", "entity_type");



CREATE INDEX "interactions_assistant_time_idx" ON "public"."interactions" USING "btree" ("assistant_id", "interaction_time" DESC);



CREATE INDEX "interactions_cost_analysis_idx" ON "public"."interactions" USING "btree" ("assistant_id", "user_id", "monthly_period", "cost_estimate");



CREATE INDEX "interactions_tokens_idx" ON "public"."interactions" USING "btree" ("token_usage", "input_tokens", "output_tokens");



CREATE INDEX "interactions_user_time_idx" ON "public"."interactions" USING "btree" ("user_id", "interaction_time" DESC);



CREATE INDEX "notifications_created_at_idx" ON "public"."notifications" USING "btree" ("created_at" DESC);



CREATE INDEX "notifications_user_id_idx" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "phone_numbers_assistant_id_idx" ON "public"."phone_numbers" USING "btree" ("assistant_id");



CREATE INDEX "usage_statistics_entity_period_idx" ON "public"."usage_statistics" USING "btree" ("entity_type", "entity_id", "period");



CREATE OR REPLACE TRIGGER "route_interaction_trigger" BEFORE INSERT ON "public"."interactions_shadow" FOR EACH ROW EXECUTE FUNCTION "public"."route_interaction_to_partition"();



CREATE OR REPLACE TRIGGER "update_notifications_updated_at" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_payment_sessions_updated_at" BEFORE UPDATE ON "public"."payment_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_payment_sessions_updated_at"();



ALTER TABLE ONLY "public"."assistant_activity"
    ADD CONSTRAINT "assistant_activity_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "public"."assistants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assistant_configs"
    ADD CONSTRAINT "assistant_configs_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."assistants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assistant_subscriptions"
    ADD CONSTRAINT "assistant_subscriptions_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "public"."assistants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assistant_subscriptions"
    ADD CONSTRAINT "assistant_subscriptions_payment_session_id_fkey" FOREIGN KEY ("payment_session_id") REFERENCES "public"."payment_sessions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."assistant_usage_limits"
    ADD CONSTRAINT "assistant_usage_limits_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "public"."assistants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interaction_metrics"
    ADD CONSTRAINT "interaction_metrics_interaction_id_fkey" FOREIGN KEY ("interaction_id") REFERENCES "public"."interactions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."phone_numbers"
    ADD CONSTRAINT "phone_numbers_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "public"."assistants"("id") ON DELETE SET NULL;



CREATE POLICY "Admins can view all interactions" ON "public"."interactions" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Service role can access all interactions" ON "public"."interactions" USING (true);



CREATE POLICY "Service role can manage all payment sessions" ON "public"."payment_sessions" USING (true);



CREATE POLICY "Users can insert their own interactions" ON "public"."interactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own payment sessions" ON "public"."payment_sessions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own payment sessions" ON "public"."payment_sessions" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own interactions" ON "public"."interactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own payment sessions" ON "public"."payment_sessions" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."assistant_activity" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assistant_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assistant_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assistant_usage_limits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assistants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interaction_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interactions_shadow" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."phone_numbers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."usage_statistics" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "analytics" TO "anon";
GRANT USAGE ON SCHEMA "analytics" TO "authenticated";
GRANT ALL ON SCHEMA "analytics" TO "service_role";



GRANT USAGE ON SCHEMA "assistants" TO "anon";
GRANT USAGE ON SCHEMA "assistants" TO "authenticated";
GRANT ALL ON SCHEMA "assistants" TO "service_role";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT USAGE ON SCHEMA "users" TO "anon";
GRANT USAGE ON SCHEMA "users" TO "authenticated";
GRANT ALL ON SCHEMA "users" TO "service_role";









































































































































































































GRANT ALL ON FUNCTION "public"."add_file_chunk"("p_file_id" "uuid", "p_chunk_index" integer, "p_chunk_text" "text", "p_pinecone_id" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."add_file_chunk"("p_file_id" "uuid", "p_chunk_index" integer, "p_chunk_text" "text", "p_pinecone_id" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_file_chunk"("p_file_id" "uuid", "p_chunk_index" integer, "p_chunk_text" "text", "p_pinecone_id" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."apply_partition_policies"() TO "anon";
GRANT ALL ON FUNCTION "public"."apply_partition_policies"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."apply_partition_policies"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_audit_logs"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_audit_logs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_audit_logs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_file_processing"("p_file_id" "uuid", "p_vector_count" integer, "p_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_file_processing"("p_file_id" "uuid", "p_vector_count" integer, "p_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_file_processing"("p_file_id" "uuid", "p_vector_count" integer, "p_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_partition_exists"("year_month" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_partition_exists"("year_month" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_partition_exists"("year_month" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_interaction"("p_assistant_id" "uuid", "p_user_id" "uuid", "p_request" "text", "p_response" "text", "p_interaction_time" timestamp with time zone, "p_chat" "text", "p_is_error" boolean, "p_token_usage" integer, "p_input_tokens" integer, "p_output_tokens" integer, "p_duration" integer, "p_cost_estimate" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."insert_interaction"("p_assistant_id" "uuid", "p_user_id" "uuid", "p_request" "text", "p_response" "text", "p_interaction_time" timestamp with time zone, "p_chat" "text", "p_is_error" boolean, "p_token_usage" integer, "p_input_tokens" integer, "p_output_tokens" integer, "p_duration" integer, "p_cost_estimate" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_interaction"("p_assistant_id" "uuid", "p_user_id" "uuid", "p_request" "text", "p_response" "text", "p_interaction_time" timestamp with time zone, "p_chat" "text", "p_is_error" boolean, "p_token_usage" integer, "p_input_tokens" integer, "p_output_tokens" integer, "p_duration" integer, "p_cost_estimate" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_interaction_metrics"("p_interaction_id" "uuid", "p_input_tokens" integer, "p_output_tokens" integer, "p_cost_estimate" numeric, "p_response_time_ms" integer, "p_ai_model" "text", "p_client_info" "jsonb", "p_sentiment_score" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."insert_interaction_metrics"("p_interaction_id" "uuid", "p_input_tokens" integer, "p_output_tokens" integer, "p_cost_estimate" numeric, "p_response_time_ms" integer, "p_ai_model" "text", "p_client_info" "jsonb", "p_sentiment_score" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_interaction_metrics"("p_interaction_id" "uuid", "p_input_tokens" integer, "p_output_tokens" integer, "p_cost_estimate" numeric, "p_response_time_ms" integer, "p_ai_model" "text", "p_client_info" "jsonb", "p_sentiment_score" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."interactions_insert_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."interactions_insert_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."interactions_insert_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."provision_twilio_number"("p_phone_number" "text", "p_twilio_sid" "text", "p_friendly_name" "text", "p_country" "text", "p_region" "text", "p_capabilities" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."provision_twilio_number"("p_phone_number" "text", "p_twilio_sid" "text", "p_friendly_name" "text", "p_country" "text", "p_region" "text", "p_capabilities" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."provision_twilio_number"("p_phone_number" "text", "p_twilio_sid" "text", "p_friendly_name" "text", "p_country" "text", "p_region" "text", "p_capabilities" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_materialized_views"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_materialized_views"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_materialized_views"() TO "service_role";



GRANT ALL ON FUNCTION "public"."route_interaction_to_partition"() TO "anon";
GRANT ALL ON FUNCTION "public"."route_interaction_to_partition"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."route_interaction_to_partition"() TO "service_role";



GRANT ALL ON FUNCTION "public"."search_file_metadata"("p_assistant_id" "uuid", "p_query" "text", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_file_metadata"("p_assistant_id" "uuid", "p_query" "text", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_file_metadata"("p_assistant_id" "uuid", "p_query" "text", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_payment_sessions_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_payment_sessions_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_payment_sessions_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_twilio_webhooks"("p_phone_id" "uuid", "p_voice_url" "text", "p_sms_url" "text", "p_sms_fallback_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_twilio_webhooks"("p_phone_id" "uuid", "p_voice_url" "text", "p_sms_url" "text", "p_sms_fallback_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_twilio_webhooks"("p_phone_id" "uuid", "p_voice_url" "text", "p_sms_url" "text", "p_sms_fallback_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."upload_file_to_pinecone"("p_assistant_id" "uuid", "p_file_name" "text", "p_file_type" "text", "p_file_size" integer, "p_file_content" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."upload_file_to_pinecone"("p_assistant_id" "uuid", "p_file_name" "text", "p_file_type" "text", "p_file_size" integer, "p_file_content" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upload_file_to_pinecone"("p_assistant_id" "uuid", "p_file_name" "text", "p_file_type" "text", "p_file_size" integer, "p_file_content" "text") TO "service_role";

































GRANT ALL ON TABLE "public"."assistant_activity" TO "anon";
GRANT ALL ON TABLE "public"."assistant_activity" TO "authenticated";
GRANT ALL ON TABLE "public"."assistant_activity" TO "service_role";



GRANT ALL ON TABLE "public"."assistant_configs" TO "anon";
GRANT ALL ON TABLE "public"."assistant_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."assistant_configs" TO "service_role";



GRANT ALL ON TABLE "public"."assistant_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."assistant_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."assistant_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."assistant_usage_limits" TO "anon";
GRANT ALL ON TABLE "public"."assistant_usage_limits" TO "authenticated";
GRANT ALL ON TABLE "public"."assistant_usage_limits" TO "service_role";



GRANT ALL ON TABLE "public"."assistants" TO "anon";
GRANT ALL ON TABLE "public"."assistants" TO "authenticated";
GRANT ALL ON TABLE "public"."assistants" TO "service_role";



GRANT ALL ON TABLE "public"."assistant_detail_view" TO "anon";
GRANT ALL ON TABLE "public"."assistant_detail_view" TO "authenticated";
GRANT ALL ON TABLE "public"."assistant_detail_view" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."interaction_metrics" TO "anon";
GRANT ALL ON TABLE "public"."interaction_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."interaction_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."interactions" TO "anon";
GRANT ALL ON TABLE "public"."interactions" TO "authenticated";
GRANT ALL ON TABLE "public"."interactions" TO "service_role";



GRANT ALL ON TABLE "public"."interactions_shadow" TO "anon";
GRANT ALL ON TABLE "public"."interactions_shadow" TO "authenticated";
GRANT ALL ON TABLE "public"."interactions_shadow" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."payment_sessions" TO "anon";
GRANT ALL ON TABLE "public"."payment_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."phone_numbers" TO "anon";
GRANT ALL ON TABLE "public"."phone_numbers" TO "authenticated";
GRANT ALL ON TABLE "public"."phone_numbers" TO "service_role";



GRANT ALL ON TABLE "public"."usage_statistics" TO "anon";
GRANT ALL ON TABLE "public"."usage_statistics" TO "authenticated";
GRANT ALL ON TABLE "public"."usage_statistics" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
