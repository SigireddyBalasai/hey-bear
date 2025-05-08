

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


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



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


CREATE OR REPLACE FUNCTION "public"."aggregate_daily_usage"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    current_date_var date := current_date;
    yesterday_date date := current_date - interval '1 day';
BEGIN
    -- Insert aggregated data for yesterday
    INSERT INTO "public"."usage_stats_daily" (
        "date", 
        "assistant_id", 
        "user_id", 
        "interactions_count", 
        "token_usage", 
        "input_tokens", 
        "output_tokens", 
        "cost_estimate"
    )
    SELECT 
        yesterday_date,
        assistant_id,
        user_id,
        COUNT(id),
        SUM(token_usage),
        SUM(input_tokens),
        SUM(output_tokens),
        SUM(cost_estimate)
    FROM 
        "public"."interactions"
    WHERE 
        interaction_time >= yesterday_date AND 
        interaction_time < (yesterday_date + interval '1 day')
    GROUP BY 
        assistant_id, user_id
    ON CONFLICT ("date", "assistant_id", "user_id") 
    DO UPDATE SET
        "interactions_count" = EXCLUDED.interactions_count,
        "token_usage" = EXCLUDED.token_usage,
        "input_tokens" = EXCLUDED.input_tokens,
        "output_tokens" = EXCLUDED.output_tokens,
        "cost_estimate" = EXCLUDED.cost_estimate;
END;
$$;


ALTER FUNCTION "public"."aggregate_daily_usage"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."aggregate_daily_usage"() IS 'Run this function daily to aggregate usage statistics';



CREATE OR REPLACE FUNCTION "public"."aggregate_monthly_usage"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    current_month text;
    current_year int;
BEGIN
    -- Get current month and year
    SELECT TO_CHAR(current_date, 'Month'), EXTRACT(YEAR FROM current_date) 
    INTO current_month, current_year;
    
    -- Insert aggregated data for the current month
    INSERT INTO "public"."monthly_usage" (
        "assistant_id", 
        "user_id", 
        "year",
        "month",
        "interaction_count", 
        "input_tokens", 
        "output_tokens", 
        "total_cost"
    )
    SELECT 
        assistant_id,
        user_id,
        EXTRACT(YEAR FROM monthly_period)::int,
        TO_CHAR(monthly_period, 'Month')::"public"."monthly_interval",
        COUNT(id),
        SUM(input_tokens),
        SUM(output_tokens),
        SUM(cost_estimate)
    FROM 
        "public"."interactions"
    WHERE 
        EXTRACT(YEAR FROM monthly_period) = current_year AND
        TO_CHAR(monthly_period, 'Month') = current_month
    GROUP BY 
        assistant_id, user_id, monthly_period
    ON CONFLICT (assistant_id, user_id, year, month) 
    DO UPDATE SET
        "interaction_count" = EXCLUDED.interaction_count,
        "input_tokens" = EXCLUDED.input_tokens,
        "output_tokens" = EXCLUDED.output_tokens,
        "total_cost" = EXCLUDED.total_cost,
        "updated_at" = NOW();
END;
$$;


ALTER FUNCTION "public"."aggregate_monthly_usage"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_phone_number"("p_assistant_id" "uuid", "p_phone_number_id" "text", "p_phone_number" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_phone_number_record record;
  v_assistant_exists boolean;
  v_assigned_count int;
BEGIN
  -- Check if the assistant exists
  SELECT EXISTS (
    SELECT 1 FROM public.assistants WHERE id = p_assistant_id
  ) INTO v_assistant_exists;
  
  IF NOT v_assistant_exists THEN
    RETURN jsonb_build_object('error', 'Assistant not found', 'status', 404);
  END IF;
  
  -- Check if the assistant already has a phone number
  SELECT COUNT(*) INTO v_assigned_count
  FROM public.phone_numbers
  WHERE assistant_id = p_assistant_id;
  
  IF v_assigned_count > 0 THEN
    RETURN jsonb_build_object('error', 'Assistant already has a phone number assigned', 'status', 409);
  END IF;
  
  -- If p_phone_number_id is provided
  IF p_phone_number_id IS NOT NULL THEN
    -- Update the phone_number
    UPDATE public.phone_numbers
    SET 
      assistant_id = p_assistant_id,
      is_assigned = TRUE,
      updated_at = now()
    WHERE id = p_phone_number_id
    RETURNING * INTO v_phone_number_record;
    
    IF v_phone_number_record.id IS NULL THEN
      RETURN jsonb_build_object('error', 'Phone number not found', 'status', 404);
    END IF;
  
  -- If p_phone_number is provided
  ELSIF p_phone_number IS NOT NULL THEN
    -- Update the phone_number by phone number value
    UPDATE public.phone_numbers
    SET 
      assistant_id = p_assistant_id,
      is_assigned = TRUE,
      updated_at = now()
    WHERE phone_number = p_phone_number
    RETURNING * INTO v_phone_number_record;
    
    IF v_phone_number_record.id IS NULL THEN
      RETURN jsonb_build_object('error', 'Phone number not found', 'status', 404);
    END IF;
  
  ELSE
    RETURN jsonb_build_object('error', 'Either phone_number_id or phone_number must be provided', 'status', 400);
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'phone_number', v_phone_number_record.phone_number,
    'assistant_id', p_assistant_id
  );
END;
$$;


ALTER FUNCTION "public"."assign_phone_number"("p_assistant_id" "uuid", "p_phone_number_id" "text", "p_phone_number" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_usage_limits_for_new_assistant"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    INSERT INTO usage_limits (assistant_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_usage_limits_for_new_assistant"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_assistant_subscription_details"("p_assistant_id" "uuid") RETURNS TABLE("subscription_id" "uuid", "stripe_subscription_id" "text", "plan" "text", "status" "text", "current_period_end" timestamp with time zone, "is_active" boolean, "days_remaining" integer, "max_messages" integer, "max_tokens" integer, "max_documents" integer, "max_webpages" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id AS subscription_id,
    s.stripe_subscription_id,
    s.plan,
    s.status,
    s.current_period_end,
    (s.status IN ('active', 'trialing')) AS is_active,
    EXTRACT(DAY FROM (s.current_period_end - NOW()))::INT AS days_remaining,
    s.max_messages,
    s.max_tokens,
    s.max_documents,
    s.max_webpages
  FROM 
    subscriptions s
  WHERE 
    s.assistant_id = p_assistant_id;
END;
$$;


ALTER FUNCTION "public"."get_assistant_subscription_details"("p_assistant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_assistant_usage"("p_assistant_id" "uuid", "p_start_date" "date" DEFAULT ((CURRENT_DATE - '30 days'::interval))::"date", "p_end_date" "date" DEFAULT CURRENT_DATE) RETURNS TABLE("interactions_count" bigint, "token_usage" bigint, "input_tokens" bigint, "output_tokens" bigint, "cost_estimate" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(i.id)::BIGINT AS interactions_count,
        COALESCE(SUM(i.token_usage), 0)::BIGINT AS token_usage,
        COALESCE(SUM(i.input_tokens), 0)::BIGINT AS input_tokens,
        COALESCE(SUM(i.output_tokens), 0)::BIGINT AS output_tokens,
        COALESCE(SUM(i.cost_estimate), 0)::numeric(10,4) AS cost_estimate
    FROM 
        public.interactions i
    WHERE 
        i.assistant_id = p_assistant_id AND
        DATE(i.interaction_time) >= p_start_date AND
        DATE(i.interaction_time) <= p_end_date;
END;
$$;


ALTER FUNCTION "public"."get_assistant_usage"("p_assistant_id" "uuid", "p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_assistants_usage_stats"("p_start_date" "date", "p_end_date" "date", "p_limit" integer DEFAULT 100, "p_offset" integer DEFAULT 0) RETURNS TABLE("assistant_id" "uuid", "assistant_name" "text", "user_id" "uuid", "interactions_count" bigint, "token_usage" bigint, "input_tokens" bigint, "output_tokens" bigint, "cost_estimate" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id AS assistant_id,
        a.name AS assistant_name,
        a.user_id AS user_id,
        COUNT(i.id)::BIGINT AS interactions_count,
        SUM(i.token_usage)::BIGINT AS token_usage,
        SUM(i.input_tokens)::BIGINT AS input_tokens,
        SUM(i.output_tokens)::BIGINT AS output_tokens,
        SUM(i.cost_estimate) AS cost_estimate
    FROM
        public.assistants a
    LEFT JOIN
        public.interactions i ON a.id = i.assistant_id AND
        DATE(i.interaction_time) >= p_start_date AND
        DATE(i.interaction_time) <= p_end_date
    GROUP BY
        a.id, a.name, a.user_id
    ORDER BY
        interactions_count DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."get_assistants_usage_stats"("p_start_date" "date", "p_end_date" "date", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_monthly_assistant_usage"("p_assistant_id" "uuid", "p_start_date" "date", "p_end_date" "date") RETURNS TABLE("year" integer, "month" integer, "month_name" "text", "interactions_count" bigint, "token_usage" bigint, "input_tokens" bigint, "output_tokens" bigint, "cost_estimate" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXTRACT(YEAR FROM i.interaction_time)::INT AS year,
        EXTRACT(MONTH FROM i.interaction_time)::INT AS month,
        TO_CHAR(i.interaction_time, 'Month') AS month_name,
        COUNT(i.id)::BIGINT AS interactions_count,
        SUM(i.token_usage)::BIGINT AS token_usage,
        SUM(i.input_tokens)::BIGINT AS input_tokens,
        SUM(i.output_tokens)::BIGINT AS output_tokens,
        SUM(i.cost_estimate) AS cost_estimate
    FROM 
        public.interactions i
    WHERE 
        i.assistant_id = p_assistant_id AND
        DATE(i.interaction_time) >= p_start_date AND
        DATE(i.interaction_time) <= p_end_date
    GROUP BY 
        year, month, month_name
    ORDER BY 
        year, month;
END;
$$;


ALTER FUNCTION "public"."get_monthly_assistant_usage"("p_assistant_id" "uuid", "p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_monthly_user_usage"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") RETURNS TABLE("year" integer, "month" integer, "month_name" "text", "interactions_count" bigint, "token_usage" bigint, "input_tokens" bigint, "output_tokens" bigint, "cost_estimate" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXTRACT(YEAR FROM i.interaction_time)::INT AS year,
        EXTRACT(MONTH FROM i.interaction_time)::INT AS month,
        TO_CHAR(i.interaction_time, 'Month') AS month_name,
        COUNT(i.id)::BIGINT AS interactions_count,
        SUM(i.token_usage)::BIGINT AS token_usage,
        SUM(i.input_tokens)::BIGINT AS input_tokens,
        SUM(i.output_tokens)::BIGINT AS output_tokens,
        SUM(i.cost_estimate) AS cost_estimate
    FROM 
        public.interactions i
    WHERE 
        i.user_id = p_user_id AND
        DATE(i.interaction_time) >= p_start_date AND
        DATE(i.interaction_time) <= p_end_date
    GROUP BY 
        year, month, month_name
    ORDER BY 
        year, month;
END;
$$;


ALTER FUNCTION "public"."get_monthly_user_usage"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_usage_limits_for_plan"("plan_type" "text") RETURNS TABLE("max_messages" integer, "max_tokens" integer, "max_documents" integer, "max_webpages" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE WHEN LOWER(plan_type) = 'premium' THEN 1000 ELSE 100 END AS max_messages,
    CASE WHEN LOWER(plan_type) = 'premium' THEN 1000000 ELSE 100000 END AS max_tokens,
    CASE WHEN LOWER(plan_type) = 'premium' THEN 25 ELSE 3 END AS max_documents,
    CASE WHEN LOWER(plan_type) = 'premium' THEN 25 ELSE 3 END AS max_webpages;
END;
$$;


ALTER FUNCTION "public"."get_usage_limits_for_plan"("plan_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_phone_numbers_count"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    phone_count integer;
BEGIN
    SELECT COUNT(pn.id) INTO phone_count
    FROM public.phone_numbers pn
    JOIN public.assistants a ON pn.assistant_id = a.id
    WHERE a.user_id = p_user_id;
    
    RETURN COALESCE(phone_count, 0);
END;
$$;


ALTER FUNCTION "public"."get_user_phone_numbers_count"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_usage"("p_user_id" "uuid", "p_start_date" "date" DEFAULT ((CURRENT_DATE - '30 days'::interval))::"date", "p_end_date" "date" DEFAULT CURRENT_DATE) RETURNS TABLE("interactions_count" bigint, "token_usage" bigint, "input_tokens" bigint, "output_tokens" bigint, "cost_estimate" numeric, "assistants_count" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(i.id)::BIGINT AS interactions_count,
        COALESCE(SUM(i.token_usage), 0)::BIGINT AS token_usage,
        COALESCE(SUM(i.input_tokens), 0)::BIGINT AS input_tokens,
        COALESCE(SUM(i.output_tokens), 0)::BIGINT AS output_tokens,
        COALESCE(SUM(i.cost_estimate), 0)::numeric(10,4) AS cost_estimate,
        COUNT(DISTINCT i.assistant_id)::BIGINT AS assistants_count
    FROM 
        public.interactions i
    WHERE 
        i.user_id = p_user_id AND
        DATE(i.interaction_time) >= p_start_date AND
        DATE(i.interaction_time) <= p_end_date;
END;
$$;


ALTER FUNCTION "public"."get_user_usage"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_users_usage_stats"("p_start_date" "date", "p_end_date" "date", "p_limit" integer DEFAULT 100, "p_offset" integer DEFAULT 0) RETURNS TABLE("user_id" "uuid", "auth_user_id" "uuid", "interactions_count" bigint, "token_usage" bigint, "input_tokens" bigint, "output_tokens" bigint, "cost_estimate" numeric, "assistants_count" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id AS user_id,
        u.auth_user_id,
        COUNT(i.id)::BIGINT AS interactions_count,
        SUM(i.token_usage)::BIGINT AS token_usage,
        SUM(i.input_tokens)::BIGINT AS input_tokens,
        SUM(i.output_tokens)::BIGINT AS output_tokens,
        SUM(i.cost_estimate) AS cost_estimate,
        COUNT(DISTINCT i.assistant_id)::BIGINT AS assistants_count
    FROM
        public.users u
    LEFT JOIN
        public.interactions i ON u.id = i.user_id AND
        DATE(i.interaction_time) >= p_start_date AND
        DATE(i.interaction_time) <= p_end_date
    GROUP BY
        u.id, u.auth_user_id
    ORDER BY
        interactions_count DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."get_users_usage_stats"("p_start_date" "date", "p_end_date" "date", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prune_old_interactions"("retention_days" integer DEFAULT 90) RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    cutoff_date date := current_date - retention_days;
    cutoff_timestamp timestamp with time zone := cutoff_date;
    deleted_count integer;
BEGIN
    -- Make sure we have usage stats aggregated before deleting
    PERFORM aggregate_daily_usage();
    
    -- Delete interactions older than cutoff_date
    DELETE FROM "public"."interactions"
    WHERE interaction_time < cutoff_timestamp;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."prune_old_interactions"("retention_days" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."prune_old_interactions"("retention_days" integer) IS 'Run this function monthly to clean up old interaction data while preserving aggregated statistics';



CREATE OR REPLACE FUNCTION "public"."set_default_plan_for_new_assistant"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    free_plan_id UUID;
BEGIN
    -- Get the ID of the free plan
    SELECT id INTO free_plan_id FROM public.plans WHERE name = 'Free' LIMIT 1;
    
    -- If the assistant doesn't have a plan_id and there's a free plan, assign it
    IF NEW.plan_id IS NULL AND free_plan_id IS NOT NULL THEN
        NEW.plan_id := free_plan_id;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_default_plan_for_new_assistant"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_monthly_period"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.monthly_period := date_trunc('month', NEW.interaction_time)::date;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_monthly_period"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."unassign_phone_number"("p_phone_number" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_phone_number_record record;
  v_old_assistant_id UUID;
BEGIN
  -- Get the current assistant_id before updating
  SELECT assistant_id INTO v_old_assistant_id
  FROM public.phone_numbers
  WHERE phone_number = p_phone_number;
  
  -- Update the phone number
  UPDATE public.phone_numbers
  SET 
    assistant_id = NULL,
    is_assigned = FALSE,
    updated_at = now()
  WHERE phone_number = p_phone_number
  RETURNING * INTO v_phone_number_record;
  
  IF v_phone_number_record.id IS NULL THEN
    RETURN jsonb_build_object('error', 'Phone number not found', 'status', 404);
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'phone_number', p_phone_number,
    'previous_assistant_id', v_old_assistant_id
  );
END;
$$;


ALTER FUNCTION "public"."unassign_phone_number"("p_phone_number" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_all_usage_on_interaction"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_date DATE;
    response_time_ms INT;
BEGIN
    v_date := CURRENT_DATE;
    
    -- Calculate response time if duration is available
    response_time_ms := COALESCE(NEW.duration, 0)::int;
    
    -- 1. Update overall assistant usage
    UPDATE assistant_usage
    SET 
        interactions_count = interactions_count + 1,
        messages_received = messages_received + 1,
        messages_sent = messages_sent + 1,
        token_usage = token_usage + COALESCE(NEW.token_usage, 0),
        input_tokens = input_tokens + COALESCE(NEW.input_tokens, 0),
        output_tokens = output_tokens + COALESCE(NEW.output_tokens, 0),
        cost_estimate = cost_estimate + COALESCE(NEW.cost_estimate, 0),
        updated_at = now()
    WHERE assistant_id = NEW.assistant_id;
    
    -- If no row exists, insert one
    IF NOT FOUND THEN
        INSERT INTO assistant_usage (
            assistant_id, 
            interactions_count,
            messages_received,
            messages_sent,
            token_usage,
            input_tokens, 
            output_tokens,
            cost_estimate
        ) VALUES (
            NEW.assistant_id,
            1,
            1,
            1,
            COALESCE(NEW.token_usage, 0),
            COALESCE(NEW.input_tokens, 0),
            COALESCE(NEW.output_tokens, 0),
            COALESCE(NEW.cost_estimate, 0)
        );
    END IF;
    
    -- 2. Process user usage if user_id exists
    IF NEW.user_id IS NOT NULL THEN
        -- Update overall user usage
        UPDATE user_usage
        SET 
            interactions_count = interactions_count + 1,
            token_usage = token_usage + COALESCE(NEW.token_usage, 0),
            input_tokens = input_tokens + COALESCE(NEW.input_tokens, 0),
            output_tokens = output_tokens + COALESCE(NEW.output_tokens, 0),
            cost_estimate = cost_estimate + COALESCE(NEW.cost_estimate, 0),
            updated_at = now()
        WHERE user_id = NEW.user_id;
        
        -- If no row exists, insert one
        IF NOT FOUND THEN
            INSERT INTO user_usage (
                user_id,
                interactions_count,
                token_usage,
                input_tokens,
                output_tokens,
                cost_estimate
            ) VALUES (
                NEW.user_id,
                1,
                COALESCE(NEW.token_usage, 0),
                COALESCE(NEW.input_tokens, 0),
                COALESCE(NEW.output_tokens, 0),
                COALESCE(NEW.cost_estimate, 0)
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_all_usage_on_interaction"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_assistant_phone_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- If a phone number is being assigned to an assistant
  IF (NEW.assistant_id IS NOT NULL AND (OLD.assistant_id IS NULL OR OLD.assistant_id <> NEW.assistant_id)) THEN
    -- Update the assistant record with this phone number
    UPDATE public.assistants
    SET assigned_phone_number = NEW.phone_number,
        updated_at = now()
    WHERE id = NEW.assistant_id;
  END IF;

  -- If a phone number is being unassigned from an assistant
  IF (OLD.assistant_id IS NOT NULL AND (NEW.assistant_id IS NULL OR NEW.assistant_id <> OLD.assistant_id)) THEN
    -- Clear the phone number from the old assistant
    UPDATE public.assistants
    SET assigned_phone_number = NULL,
        updated_at = now()
    WHERE id = OLD.assistant_id;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_assistant_phone_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_interaction_usage"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update last active time for user
    IF NEW.user_id IS NOT NULL THEN
        UPDATE users
        SET last_active = NOW()
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_interaction_usage"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_phone_assignment"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update assistant's phone number assignment
    IF NEW.assistant_id IS NOT NULL THEN
        UPDATE public.assistants
        SET assigned_phone_number = NEW.phone_number,
            updated_at = NOW()
        WHERE id = NEW.assistant_id;
    END IF;
    
    -- If assistant ID has been removed, update the old assistant
    IF OLD.assistant_id IS NOT NULL AND (NEW.assistant_id IS NULL OR NEW.assistant_id <> OLD.assistant_id) THEN
        UPDATE public.assistants
        SET assigned_phone_number = NULL,
            updated_at = NOW()
        WHERE id = OLD.assistant_id;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_phone_assignment"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_subscription"("p_assistant_id" "uuid", "p_stripe_subscription_id" "text", "p_plan" "text", "p_status" "text", "p_current_period_end" timestamp with time zone) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update the subscription record or create if it doesn't exist
    INSERT INTO subscriptions 
        (assistant_id, stripe_subscription_id, plan, status, current_period_end, updated_at)
    VALUES 
        (p_assistant_id, p_stripe_subscription_id, p_plan, p_status, p_current_period_end, now())
    ON CONFLICT (assistant_id) 
    DO UPDATE SET
        stripe_subscription_id = p_stripe_subscription_id,
        plan = p_plan,
        status = p_status,
        current_period_end = p_current_period_end,
        updated_at = now();
END;
$$;


ALTER FUNCTION "public"."update_subscription"("p_assistant_id" "uuid", "p_stripe_subscription_id" "text", "p_plan" "text", "p_status" "text", "p_current_period_end" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_subscription"("p_assistant_id" "uuid", "p_stripe_subscription_id" "text", "p_plan" "text", "p_status" "text", "p_current_period_end" timestamp with time zone, "p_current_period_start" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update the assistant record with subscription details
    UPDATE assistants 
    SET
        stripe_subscription_id = p_stripe_subscription_id,
        subscription_plan = p_plan,
        subscription_status = p_status,
        current_period_end = p_current_period_end,
        current_period_start = COALESCE(p_current_period_start, NOW()),
        updated_at = NOW()
    WHERE id = p_assistant_id;
END;
$$;


ALTER FUNCTION "public"."update_subscription"("p_assistant_id" "uuid", "p_stripe_subscription_id" "text", "p_plan" "text", "p_status" "text", "p_current_period_end" timestamp with time zone, "p_current_period_start" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_usage_limits_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_usage_limits_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_last_active"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.user_id IS NOT NULL THEN
        UPDATE public.users
        SET last_active = NOW(),
            updated_at = NOW()
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_last_active"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_usage_stats"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Update user usage statistics
  UPDATE public.userusage
  SET 
    interactions_used = COALESCE(interactions_used, 0) + 1,
    token_usage = COALESCE(token_usage, 0) + COALESCE(NEW.token_usage, 0),
    cost_estimate = COALESCE(cost_estimate, 0) + COALESCE(NEW.cost_estimate, 0)
  WHERE user_id = NEW.user_id;

  -- If no row exists for this user, create one
  IF NOT FOUND THEN
    INSERT INTO public.userusage (
      user_id, 
      interactions_used, 
      assistants_used, 
      token_usage,
      cost_estimate
    ) VALUES (
      NEW.user_id, 
      1, 
      0, 
      COALESCE(NEW.token_usage, 0),
      COALESCE(NEW.cost_estimate, 0)
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_usage_stats"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."assistants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "params" "jsonb",
    "assigned_phone_number" "text",
    "pinecone_name" "text",
    "twilio_app_sid" "text",
    "is_starred" boolean DEFAULT false,
    "description" "text",
    "pending" boolean DEFAULT false,
    "system_prompt" "text"
);


ALTER TABLE "public"."assistants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."monthly_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assistant_id" "uuid",
    "user_id" "uuid",
    "year" integer NOT NULL,
    "month" "public"."monthly_interval" NOT NULL,
    "interaction_count" integer DEFAULT 0,
    "input_tokens" bigint DEFAULT 0,
    "output_tokens" bigint DEFAULT 0,
    "total_cost" numeric(10,4) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "monthly_usage_input_tokens_check" CHECK (("input_tokens" >= 0)),
    CONSTRAINT "monthly_usage_interaction_count_check" CHECK (("interaction_count" >= 0)),
    CONSTRAINT "monthly_usage_output_tokens_check" CHECK (("output_tokens" >= 0)),
    CONSTRAINT "monthly_usage_total_cost_check" CHECK (("total_cost" >= (0)::numeric)),
    CONSTRAINT "monthly_usage_year_check" CHECK ((("year" >= 2020) AND ("year" <= 2100)))
);


ALTER TABLE "public"."monthly_usage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."phone_numbers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "phone_number" "text" NOT NULL,
    "assistant_id" "uuid",
    "country" "public"."country",
    "status" "text" DEFAULT 'available'::"text",
    "capabilities" "jsonb" DEFAULT '{"mms": false, "sms": true, "voice": true}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_assigned" boolean,
    CONSTRAINT "phone_numbers_status_check" CHECK (("status" = ANY (ARRAY['available'::"text", 'assigned'::"text", 'disabled'::"text"])))
);


ALTER TABLE "public"."phone_numbers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assistant_id" "uuid",
    "stripe_subscription_id" "text",
    "plan" "text" NOT NULL,
    "status" "text" NOT NULL,
    "current_period_end" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "subscriptions_plan_check" CHECK (("plan" = ANY (ARRAY['free'::"text", 'basic'::"text", 'pro'::"text"]))),
    CONSTRAINT "subscriptions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'trialing'::"text", 'canceled'::"text"])))
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."assistant_stats" AS
 SELECT "a"."id" AS "assistant_id",
    "a"."name" AS "assistant_name",
    "a"."user_id",
    "s"."plan",
    "s"."status" AS "subscription_status",
    COALESCE("sum"("mu"."interaction_count"), (0)::bigint) AS "total_interactions",
    COALESCE("sum"("mu"."input_tokens"), (0)::numeric) AS "total_input_tokens",
    COALESCE("sum"("mu"."output_tokens"), (0)::numeric) AS "total_output_tokens",
    COALESCE("sum"("mu"."total_cost"), (0)::numeric) AS "total_cost",
    "pn"."phone_number"
   FROM ((("public"."assistants" "a"
     LEFT JOIN "public"."monthly_usage" "mu" ON (("a"."id" = "mu"."assistant_id")))
     LEFT JOIN "public"."subscriptions" "s" ON (("a"."id" = "s"."assistant_id")))
     LEFT JOIN "public"."phone_numbers" "pn" ON (("a"."id" = "pn"."assistant_id")))
  GROUP BY "a"."id", "a"."name", "a"."user_id", "s"."plan", "s"."status", "pn"."phone_number";


ALTER TABLE "public"."assistant_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assistant_id" "uuid",
    "user_id" "uuid",
    "interaction_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "request" "text" NOT NULL,
    "response" "text" NOT NULL,
    "input_tokens" integer DEFAULT 0,
    "output_tokens" integer DEFAULT 0,
    "cost_estimate" numeric(10,4) DEFAULT 0,
    "monthly_period" "date",
    "token_usage" numeric,
    "is_error" boolean,
    "duration" double precision,
    "chat" "text",
    CONSTRAINT "interactions_cost_estimate_check" CHECK (("cost_estimate" >= (0)::numeric)),
    CONSTRAINT "interactions_input_tokens_check" CHECK (("input_tokens" >= 0)),
    CONSTRAINT "interactions_output_tokens_check" CHECK (("output_tokens" >= 0))
);
ALTER TABLE ONLY "public"."interactions" ALTER COLUMN "request" SET COMPRESSION pglz;
ALTER TABLE ONLY "public"."interactions" ALTER COLUMN "response" SET COMPRESSION pglz;


ALTER TABLE "public"."interactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auth_user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_admin" boolean DEFAULT false,
    "last_active" timestamp with time zone,
    "metadata" "jsonb",
    "stripe_customer_id" "text"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."user_stats" AS
 SELECT "u"."id" AS "user_id",
    "u"."auth_user_id",
    "u"."last_active",
    COALESCE("sum"("mu"."interaction_count"), (0)::bigint) AS "total_interactions",
    COALESCE("sum"(("mu"."input_tokens" + "mu"."output_tokens")), (0)::numeric) AS "total_tokens",
    COALESCE("sum"("mu"."total_cost"), (0)::numeric) AS "total_cost",
    "count"(DISTINCT "a"."id") AS "assistants_count"
   FROM (("public"."users" "u"
     LEFT JOIN "public"."assistants" "a" ON (("u"."id" = "a"."user_id")))
     LEFT JOIN "public"."monthly_usage" "mu" ON (("u"."id" = "mu"."user_id")))
  GROUP BY "u"."id", "u"."auth_user_id", "u"."last_active";


ALTER TABLE "public"."user_stats" OWNER TO "postgres";


ALTER TABLE ONLY "public"."assistants"
    ADD CONSTRAINT "assistants_pinecone_name_key" UNIQUE ("pinecone_name");



ALTER TABLE ONLY "public"."assistants"
    ADD CONSTRAINT "assistants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interactions"
    ADD CONSTRAINT "interactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."monthly_usage"
    ADD CONSTRAINT "monthly_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."monthly_usage"
    ADD CONSTRAINT "monthly_usage_unique_constraint" UNIQUE ("assistant_id", "user_id", "year", "month");



ALTER TABLE ONLY "public"."phone_numbers"
    ADD CONSTRAINT "phone_numbers_phone_number_key" UNIQUE ("phone_number");



ALTER TABLE ONLY "public"."phone_numbers"
    ADD CONSTRAINT "phone_numbers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_assistant_id_unique" UNIQUE ("assistant_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_auth_user_id_key" UNIQUE ("auth_user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_stripe_customer_id_key" UNIQUE ("stripe_customer_id");



CREATE INDEX "idx_assistants_user" ON "public"."assistants" USING "btree" ("user_id");



CREATE INDEX "idx_interactions_assistant" ON "public"."interactions" USING "btree" ("assistant_id");



CREATE INDEX "idx_interactions_monthly" ON "public"."interactions" USING "btree" ("monthly_period");



CREATE INDEX "idx_interactions_user_time" ON "public"."interactions" USING "btree" ("user_id", "interaction_time");



CREATE INDEX "idx_monthly_usage_main" ON "public"."monthly_usage" USING "btree" ("year", "month", "assistant_id");



CREATE INDEX "idx_phone_numbers_status" ON "public"."phone_numbers" USING "btree" ("status");



CREATE INDEX "idx_subscriptions_status" ON "public"."subscriptions" USING "btree" ("status");



CREATE OR REPLACE TRIGGER "set_monthly_period_trigger" BEFORE INSERT ON "public"."interactions" FOR EACH ROW EXECUTE FUNCTION "public"."set_monthly_period"();



CREATE OR REPLACE TRIGGER "update_phone_assignment_trigger" AFTER INSERT OR UPDATE OF "assistant_id" ON "public"."phone_numbers" FOR EACH ROW EXECUTE FUNCTION "public"."update_phone_assignment"();



CREATE OR REPLACE TRIGGER "update_user_last_active_trigger" AFTER INSERT ON "public"."interactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_last_active"();



ALTER TABLE ONLY "public"."assistants"
    ADD CONSTRAINT "assistants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interactions"
    ADD CONSTRAINT "interactions_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "public"."assistants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interactions"
    ADD CONSTRAINT "interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."monthly_usage"
    ADD CONSTRAINT "monthly_usage_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "public"."assistants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."monthly_usage"
    ADD CONSTRAINT "monthly_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."phone_numbers"
    ADD CONSTRAINT "phone_numbers_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "public"."assistants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "public"."assistants"("id") ON DELETE CASCADE;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."aggregate_daily_usage"() TO "anon";
GRANT ALL ON FUNCTION "public"."aggregate_daily_usage"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."aggregate_daily_usage"() TO "service_role";



GRANT ALL ON FUNCTION "public"."aggregate_monthly_usage"() TO "anon";
GRANT ALL ON FUNCTION "public"."aggregate_monthly_usage"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."aggregate_monthly_usage"() TO "service_role";



GRANT ALL ON FUNCTION "public"."assign_phone_number"("p_assistant_id" "uuid", "p_phone_number_id" "text", "p_phone_number" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."assign_phone_number"("p_assistant_id" "uuid", "p_phone_number_id" "text", "p_phone_number" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_phone_number"("p_assistant_id" "uuid", "p_phone_number_id" "text", "p_phone_number" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_usage_limits_for_new_assistant"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_usage_limits_for_new_assistant"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_usage_limits_for_new_assistant"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_assistant_subscription_details"("p_assistant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_assistant_subscription_details"("p_assistant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_assistant_subscription_details"("p_assistant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_assistant_usage"("p_assistant_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_assistant_usage"("p_assistant_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_assistant_usage"("p_assistant_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_assistants_usage_stats"("p_start_date" "date", "p_end_date" "date", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_assistants_usage_stats"("p_start_date" "date", "p_end_date" "date", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_assistants_usage_stats"("p_start_date" "date", "p_end_date" "date", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_monthly_assistant_usage"("p_assistant_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_monthly_assistant_usage"("p_assistant_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_monthly_assistant_usage"("p_assistant_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_monthly_user_usage"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_monthly_user_usage"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_monthly_user_usage"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_usage_limits_for_plan"("plan_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_usage_limits_for_plan"("plan_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_usage_limits_for_plan"("plan_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_phone_numbers_count"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_phone_numbers_count"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_phone_numbers_count"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_usage"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_usage"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_usage"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_users_usage_stats"("p_start_date" "date", "p_end_date" "date", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_users_usage_stats"("p_start_date" "date", "p_end_date" "date", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_users_usage_stats"("p_start_date" "date", "p_end_date" "date", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."prune_old_interactions"("retention_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."prune_old_interactions"("retention_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."prune_old_interactions"("retention_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_default_plan_for_new_assistant"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_default_plan_for_new_assistant"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_default_plan_for_new_assistant"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_monthly_period"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_monthly_period"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_monthly_period"() TO "service_role";



GRANT ALL ON FUNCTION "public"."unassign_phone_number"("p_phone_number" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."unassign_phone_number"("p_phone_number" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unassign_phone_number"("p_phone_number" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_all_usage_on_interaction"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_all_usage_on_interaction"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_all_usage_on_interaction"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_assistant_phone_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_assistant_phone_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_assistant_phone_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_interaction_usage"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_interaction_usage"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_interaction_usage"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_phone_assignment"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_phone_assignment"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_phone_assignment"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_subscription"("p_assistant_id" "uuid", "p_stripe_subscription_id" "text", "p_plan" "text", "p_status" "text", "p_current_period_end" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."update_subscription"("p_assistant_id" "uuid", "p_stripe_subscription_id" "text", "p_plan" "text", "p_status" "text", "p_current_period_end" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_subscription"("p_assistant_id" "uuid", "p_stripe_subscription_id" "text", "p_plan" "text", "p_status" "text", "p_current_period_end" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_subscription"("p_assistant_id" "uuid", "p_stripe_subscription_id" "text", "p_plan" "text", "p_status" "text", "p_current_period_end" timestamp with time zone, "p_current_period_start" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."update_subscription"("p_assistant_id" "uuid", "p_stripe_subscription_id" "text", "p_plan" "text", "p_status" "text", "p_current_period_end" timestamp with time zone, "p_current_period_start" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_subscription"("p_assistant_id" "uuid", "p_stripe_subscription_id" "text", "p_plan" "text", "p_status" "text", "p_current_period_end" timestamp with time zone, "p_current_period_start" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_usage_limits_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_usage_limits_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_usage_limits_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_last_active"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_last_active"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_last_active"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_usage_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_usage_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_usage_stats"() TO "service_role";



























GRANT ALL ON TABLE "public"."assistants" TO "anon";
GRANT ALL ON TABLE "public"."assistants" TO "authenticated";
GRANT ALL ON TABLE "public"."assistants" TO "service_role";



GRANT ALL ON TABLE "public"."monthly_usage" TO "anon";
GRANT ALL ON TABLE "public"."monthly_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."monthly_usage" TO "service_role";



GRANT ALL ON TABLE "public"."phone_numbers" TO "anon";
GRANT ALL ON TABLE "public"."phone_numbers" TO "authenticated";
GRANT ALL ON TABLE "public"."phone_numbers" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."assistant_stats" TO "anon";
GRANT ALL ON TABLE "public"."assistant_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."assistant_stats" TO "service_role";



GRANT ALL ON TABLE "public"."interactions" TO "anon";
GRANT ALL ON TABLE "public"."interactions" TO "authenticated";
GRANT ALL ON TABLE "public"."interactions" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."user_stats" TO "anon";
GRANT ALL ON TABLE "public"."user_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."user_stats" TO "service_role";









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
