

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


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pgsodium";






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


CREATE TYPE "public"."subscription_status" AS ENUM (
    'active',
    'trialing',
    'past_due',
    'canceled',
    'unpaid'
);


ALTER TYPE "public"."subscription_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."archive_monthly_usage"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF DATE_TRUNC('month', NOW()) <> NEW.current_period_start THEN
        INSERT INTO public.historical_usage (
            assistant_id, period, messages_used, tokens_used, 
            documents_used, webpages_used, peak_usage_date
        )
        SELECT
            NEW.assistant_id,
            OLD.current_period_start,
            OLD.current_month_messages,
            OLD.current_month_tokens,
            OLD.current_month_documents,
            OLD.current_month_webpages,
            MAX(i.interaction_time)
        FROM public.interactions i
        WHERE i.assistant_id = NEW.assistant_id
            AND i.interaction_time >= OLD.current_period_start
            AND i.interaction_time < DATE_TRUNC('month', NOW())
        ON CONFLICT (assistant_id, period) DO UPDATE
        SET
            messages_used = EXCLUDED.messages_used,
            tokens_used = EXCLUDED.tokens_used,
            documents_used = EXCLUDED.documents_used,
            webpages_used = EXCLUDED.webpages_used,
            peak_usage_date = EXCLUDED.peak_usage_date;

        NEW.current_month_messages := 0;
        NEW.current_month_tokens := 0;
        NEW.current_month_documents := 0;
        NEW.current_month_webpages := 0;
        NEW.current_period_start := DATE_TRUNC('month', NOW());
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."archive_monthly_usage"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."enforce_message_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    current_used INT;
    current_limit INT;
BEGIN
    SELECT lim.message_used, s.message_limit
    INTO current_used, current_limit
    FROM public.assistant_limits lim
    JOIN public.assistant_subscriptions s ON lim.assistant_id = s.assistant_id
    WHERE lim.assistant_id = NEW.assistant_id;

    IF current_used >= current_limit THEN
        RAISE EXCEPTION 'Message limit exceeded for assistant %', NEW.assistant_id
        USING HINT = 'Upgrade your plan for additional messages';
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."enforce_message_limit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_feature_access"("p_assistant_id" "uuid", "p_feature" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    has_access BOOLEAN;
BEGIN
    SELECT features_enabled->>p_feature = 'true'
    INTO has_access
    FROM public.assistant_configs
    WHERE id = p_assistant_id;
    
    RETURN COALESCE(has_access, false);
END;
$$;


ALTER FUNCTION "public"."has_feature_access"("p_assistant_id" "uuid", "p_feature" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_plan_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.product_id <> OLD.product_id THEN
        INSERT INTO public.audit_logs (
            entity_id,
            entity_type,
            action,
            details,
            performed_by
        ) VALUES (
            NEW.assistant_id,
            'subscription',
            'plan_change',
            jsonb_build_object(
                'old_plan', OLD.product_id,
                'new_plan', NEW.product_id,
                'old_plan_name', OLD.plan_name,
                'new_plan_name', NEW.plan_name
            ),
            auth.uid()
        );
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_plan_change"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."reset_usage_limits"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.status = 'active' AND OLD.status <> 'active' THEN
        UPDATE public.assistant_limits
        SET 
            message_used = 0,
            token_used = 0,
            documents_used = 0,
            webpages_used = 0,
            current_month_messages = 0,
            current_month_tokens = 0,
            current_month_documents = 0,
            current_month_webpages = 0,
            last_reset = NOW()
        WHERE assistant_id = NEW.assistant_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."reset_usage_limits"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_usage"("p_assistant_id" "uuid", "p_messages" integer DEFAULT 0, "p_tokens" integer DEFAULT 0, "p_documents" integer DEFAULT 0, "p_webpages" integer DEFAULT 0) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    INSERT INTO public.assistant_limits (assistant_id)
    VALUES (p_assistant_id)
    ON CONFLICT (assistant_id) DO NOTHING;

    UPDATE public.assistant_limits
    SET
        message_used = message_used + p_messages,
        token_used = token_used + p_tokens,
        documents_used = documents_used + p_documents,
        webpages_used = webpages_used + p_webpages,
        current_month_messages = current_month_messages + p_messages,
        current_month_tokens = current_month_tokens + p_tokens,
        current_month_documents = current_month_documents + p_documents,
        current_month_webpages = current_month_webpages + p_webpages,
        updated_at = NOW()
    WHERE assistant_id = p_assistant_id;
END;
$$;


ALTER FUNCTION "public"."update_usage"("p_assistant_id" "uuid", "p_messages" integer, "p_tokens" integer, "p_documents" integer, "p_webpages" integer) OWNER TO "postgres";

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
    "share_phone_number" boolean DEFAULT false,
    "timezone" "text" DEFAULT 'UTC'::"text",
    "business_hours" "jsonb" DEFAULT '{"end": "17:00", "start": "09:00"}'::"jsonb",
    "features_enabled" "jsonb" DEFAULT '{"analytics": false, "email_support": false, "webhook_access": false, "document_upload": false, "webpage_crawling": false}'::"jsonb",
    "webhook_url" "text",
    "webhook_enabled" boolean DEFAULT false
);


ALTER TABLE "public"."assistant_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assistant_limits" (
    "assistant_id" "uuid" NOT NULL,
    "message_used" integer DEFAULT 0 NOT NULL,
    "token_used" integer DEFAULT 0 NOT NULL,
    "documents_used" integer DEFAULT 0 NOT NULL,
    "webpages_used" integer DEFAULT 0 NOT NULL,
    "current_month_messages" integer DEFAULT 0 NOT NULL,
    "current_month_tokens" integer DEFAULT 0 NOT NULL,
    "current_month_documents" integer DEFAULT 0 NOT NULL,
    "current_month_webpages" integer DEFAULT 0 NOT NULL,
    "current_period_start" "date" DEFAULT "date_trunc"('month'::"text", "now"()) NOT NULL,
    "last_reset" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."assistant_limits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assistant_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assistant_id" "uuid" NOT NULL,
    "plan_id" "text" NOT NULL,
    "stripe_subscription_id" "text",
    "status" "public"."subscription_status" NOT NULL,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "cancel_at_period_end" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "payment_session_id" "uuid",
    "message_limit" integer,
    "document_limit" integer,
    "webpage_limit" integer,
    "plan_name" "text",
    "currency" "text" DEFAULT 'CAD'::"text",
    "price" numeric(10,2),
    "product_id" "text",
    "support_level" "text" DEFAULT 'basic'::"text",
    "support_email" "text"
);


ALTER TABLE "public"."assistant_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assistants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "is_starred" boolean DEFAULT false,
    "pending" boolean DEFAULT false,
    "assigned_phone_number" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."assistants" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."assistant_detail_view" AS
 SELECT "a"."id",
    "a"."name" AS "assistant_name",
    "a"."user_id",
    "a"."is_active",
    "a"."created_at" AS "assistant_created_at",
    "a"."updated_at" AS "assistant_updated_at",
    "ac"."system_prompt",
    "ac"."description",
    "ac"."business_name",
    "ac"."pinecone_name",
    "ac"."display_name",
    "ac"."personality",
    "ac"."features_enabled",
    "ac"."webhook_enabled",
    "ac"."created_at" AS "config_created_at",
    "ac"."updated_at" AS "config_updated_at",
    "act"."last_activity_at",
    "act"."total_interactions",
    "sub"."plan_id",
    "sub"."plan_name",
    "sub"."status" AS "subscription_status",
    "sub"."current_period_end",
    "sub"."message_limit",
    "sub"."document_limit",
    "sub"."webpage_limit",
    "lim"."message_used",
    "lim"."token_used"
   FROM (((("public"."assistants" "a"
     LEFT JOIN "public"."assistant_configs" "ac" ON (("a"."id" = "ac"."id")))
     LEFT JOIN "public"."assistant_activity" "act" ON (("a"."id" = "act"."assistant_id")))
     LEFT JOIN "public"."assistant_subscriptions" "sub" ON (("a"."id" = "sub"."assistant_id")))
     LEFT JOIN "public"."assistant_limits" "lim" ON (("a"."id" = "lim"."assistant_id")));


ALTER TABLE "public"."assistant_detail_view" OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "public"."historical_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assistant_id" "uuid" NOT NULL,
    "period" "date" NOT NULL,
    "messages_used" integer NOT NULL,
    "tokens_used" integer NOT NULL,
    "documents_used" integer NOT NULL,
    "webpages_used" integer NOT NULL,
    "peak_usage_date" timestamp with time zone,
    "avg_daily_messages" numeric(5,2),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."historical_usage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "assistant_id" "uuid" NOT NULL,
    "request" "jsonb",
    "response" "jsonb",
    "chat" "jsonb",
    "interaction_time" timestamp with time zone DEFAULT "now"(),
    "token_usage" integer,
    "input_tokens" integer,
    "output_tokens" integer,
    "cost_estimate" numeric(10,6),
    "duration" integer,
    "is_error" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "status" "text" DEFAULT 'completed'::"text",
    "error_message" "text",
    "source" "text",
    "model" "text",
    "session_id" "uuid",
    CONSTRAINT "interactions_source_check" CHECK (("source" = ANY (ARRAY['sms'::"text", 'voice'::"text", 'web'::"text", 'api'::"text"])))
);


ALTER TABLE "public"."interactions" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."interaction_phone_summary" AS
 SELECT "interactions"."assistant_id",
    ("interactions"."metadata" ->> 'phone_number'::"text") AS "phone",
    "count"(*) AS "total_calls",
    "avg"("interactions"."duration") AS "avg_duration"
   FROM "public"."interactions"
  WHERE ("interactions"."metadata" ? 'phone_number'::"text")
  GROUP BY "interactions"."assistant_id", ("interactions"."metadata" ->> 'phone_number'::"text")
  WITH NO DATA;


ALTER TABLE "public"."interaction_phone_summary" OWNER TO "postgres";


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
    "sms_fallback_url" "text",
    "capabilities_enabled" "jsonb" DEFAULT '{"mms": false, "sms": false, "voice": false}'::"jsonb",
    CONSTRAINT "phone_number_format_check" CHECK (("phone_number" ~ '^\+\d{1,15}$'::"text")),
    CONSTRAINT "status_check" CHECK (("status" = ANY (ARRAY['available'::"text", 'assigned'::"text", 'pending'::"text", 'suspended'::"text"])))
);

ALTER TABLE ONLY "public"."phone_numbers" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."phone_numbers" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."plan_details" AS
 SELECT "s"."assistant_id",
    "s"."product_id",
    "s"."plan_name",
    "s"."price",
    "s"."currency",
    "s"."message_limit",
    "s"."document_limit",
    "s"."webpage_limit",
    "c"."features_enabled",
    "p"."capabilities_enabled",
    "s"."support_level",
    "s"."support_email"
   FROM (("public"."assistant_subscriptions" "s"
     JOIN "public"."assistant_configs" "c" ON (("s"."assistant_id" = "c"."id")))
     LEFT JOIN "public"."phone_numbers" "p" ON (("s"."assistant_id" = "p"."assistant_id")));


ALTER TABLE "public"."plan_details" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."usage_overview" AS
 SELECT "a"."id" AS "assistant_id",
    "a"."name" AS "assistant_name",
    "s"."plan_name",
    "s"."message_limit",
    "s"."document_limit",
    "s"."webpage_limit",
    "lim"."message_used",
    "lim"."token_used",
    "lim"."documents_used",
    "lim"."webpages_used",
    ("s"."message_limit" - "lim"."message_used") AS "messages_remaining",
    ("s"."document_limit" - "lim"."documents_used") AS "documents_remaining",
    ("s"."webpage_limit" - "lim"."webpages_used") AS "webpages_remaining",
    "lim"."current_month_messages",
    "lim"."current_month_tokens"
   FROM (("public"."assistants" "a"
     LEFT JOIN "public"."assistant_limits" "lim" ON (("a"."id" = "lim"."assistant_id")))
     LEFT JOIN "public"."assistant_subscriptions" "s" ON (("a"."id" = "s"."assistant_id")));


ALTER TABLE "public"."usage_overview" OWNER TO "postgres";


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


ALTER TABLE ONLY "public"."assistant_activity"
    ADD CONSTRAINT "assistant_activity_pkey" PRIMARY KEY ("assistant_id");



ALTER TABLE ONLY "public"."assistant_configs"
    ADD CONSTRAINT "assistant_configs_pinecone_name_key" UNIQUE ("pinecone_name");



ALTER TABLE ONLY "public"."assistant_configs"
    ADD CONSTRAINT "assistant_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assistant_limits"
    ADD CONSTRAINT "assistant_limits_pkey" PRIMARY KEY ("assistant_id");



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



ALTER TABLE ONLY "public"."historical_usage"
    ADD CONSTRAINT "historical_usage_assistant_id_period_key" UNIQUE ("assistant_id", "period");



ALTER TABLE ONLY "public"."historical_usage"
    ADD CONSTRAINT "historical_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interactions"
    ADD CONSTRAINT "interactions_pkey" PRIMARY KEY ("id");



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



CREATE INDEX "idx_assistant_activity_assistant_id" ON "public"."assistant_activity" USING "btree" ("assistant_id");



CREATE INDEX "idx_assistant_configs_id" ON "public"."assistant_configs" USING "btree" ("id");



CREATE INDEX "idx_assistant_subscriptions_assistant_id" ON "public"."assistant_subscriptions" USING "btree" ("assistant_id");



CREATE INDEX "idx_assistant_subscriptions_payment_session" ON "public"."assistant_subscriptions" USING "btree" ("payment_session_id");



CREATE INDEX "idx_assistant_usage_limits_assistant_id" ON "public"."assistant_usage_limits" USING "btree" ("assistant_id");



CREATE INDEX "idx_assistants_active" ON "public"."assistants" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_historical_usage_assistant" ON "public"."historical_usage" USING "btree" ("assistant_id", "period");



CREATE INDEX "idx_historical_usage_period" ON "public"."historical_usage" USING "btree" ("period");



CREATE INDEX "idx_interactions_session" ON "public"."interactions" USING "btree" ("session_id");



CREATE INDEX "idx_limits_assistant" ON "public"."assistant_limits" USING "btree" ("assistant_id");



CREATE INDEX "idx_payment_sessions_created_at" ON "public"."payment_sessions" USING "btree" ("created_at");



CREATE INDEX "idx_payment_sessions_expires_at" ON "public"."payment_sessions" USING "btree" ("expires_at");



CREATE INDEX "idx_payment_sessions_session_id" ON "public"."payment_sessions" USING "btree" ("session_id");



CREATE INDEX "idx_payment_sessions_status" ON "public"."payment_sessions" USING "btree" ("status");



CREATE INDEX "idx_payment_sessions_user_id" ON "public"."payment_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_phone_numbers_is_assigned" ON "public"."phone_numbers" USING "btree" ("is_assigned");



CREATE INDEX "idx_phone_numbers_phone_number" ON "public"."phone_numbers" USING "btree" ("phone_number");



CREATE INDEX "idx_phone_numbers_unassigned" ON "public"."phone_numbers" USING "btree" ("id", "created_at") WHERE ("is_assigned" = false);



CREATE INDEX "idx_phone_status" ON "public"."phone_numbers" USING "btree" ("status");



CREATE INDEX "idx_usage_statistics_entity" ON "public"."usage_statistics" USING "btree" ("entity_id", "entity_type");



CREATE INDEX "idx_usage_statistics_entity_type_entity_id" ON "public"."usage_statistics" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_usage_statistics_period" ON "public"."usage_statistics" USING "btree" ("period");



CREATE INDEX "idx_usage_statistics_period_entity_type" ON "public"."usage_statistics" USING "btree" ("period", "entity_type");



CREATE INDEX "interactions_assistant_id_idx" ON "public"."interactions" USING "btree" ("assistant_id");



CREATE INDEX "interactions_interaction_time_idx" ON "public"."interactions" USING "btree" ("interaction_time");



CREATE INDEX "interactions_metadata_gin_idx" ON "public"."interactions" USING "gin" ("metadata");



CREATE INDEX "interactions_status_idx" ON "public"."interactions" USING "btree" ("status");



CREATE INDEX "interactions_user_id_idx" ON "public"."interactions" USING "btree" ("user_id");



CREATE INDEX "phone_numbers_assistant_id_idx" ON "public"."phone_numbers" USING "btree" ("assistant_id");



CREATE INDEX "usage_statistics_entity_period_idx" ON "public"."usage_statistics" USING "btree" ("entity_type", "entity_id", "period");



CREATE OR REPLACE TRIGGER "trg_check_new_month" BEFORE UPDATE ON "public"."assistant_limits" FOR EACH ROW EXECUTE FUNCTION "public"."archive_monthly_usage"();



CREATE OR REPLACE TRIGGER "trg_enforce_message_limit" BEFORE INSERT ON "public"."interactions" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_message_limit"();



CREATE OR REPLACE TRIGGER "trg_plan_change" AFTER UPDATE ON "public"."assistant_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."log_plan_change"();



CREATE OR REPLACE TRIGGER "trg_subscription_status_change" AFTER UPDATE OF "status" ON "public"."assistant_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."reset_usage_limits"();



CREATE OR REPLACE TRIGGER "update_interactions_updated_at" BEFORE UPDATE ON "public"."interactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_payment_sessions_updated_at" BEFORE UPDATE ON "public"."payment_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_payment_sessions_updated_at"();



ALTER TABLE ONLY "public"."assistant_activity"
    ADD CONSTRAINT "assistant_activity_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "public"."assistants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assistant_configs"
    ADD CONSTRAINT "assistant_configs_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."assistants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assistant_limits"
    ADD CONSTRAINT "assistant_limits_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "public"."assistants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assistant_subscriptions"
    ADD CONSTRAINT "assistant_subscriptions_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "public"."assistants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assistant_subscriptions"
    ADD CONSTRAINT "assistant_subscriptions_payment_session_id_fkey" FOREIGN KEY ("payment_session_id") REFERENCES "public"."payment_sessions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."assistant_usage_limits"
    ADD CONSTRAINT "assistant_usage_limits_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "public"."assistants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."historical_usage"
    ADD CONSTRAINT "historical_usage_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "public"."assistants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interactions"
    ADD CONSTRAINT "interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."phone_numbers"
    ADD CONSTRAINT "phone_numbers_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "public"."assistants"("id") ON DELETE SET NULL;



CREATE POLICY "Enable users to view their own data only" ON "public"."payment_sessions" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Service role can manage all payment sessions" ON "public"."payment_sessions" USING (true);



CREATE POLICY "User access to assistant limits" ON "public"."assistant_limits" USING (("assistant_id" IN ( SELECT "assistants"."id"
   FROM "public"."assistants"
  WHERE ("assistants"."user_id" = "auth"."uid"()))));



CREATE POLICY "User access to historical usage" ON "public"."historical_usage" FOR SELECT USING (("assistant_id" IN ( SELECT "assistants"."id"
   FROM "public"."assistants"
  WHERE ("assistants"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete their assistant activity" ON "public"."assistant_activity" FOR DELETE USING (("assistant_id" IN ( SELECT "assistants"."id"
   FROM "public"."assistants"
  WHERE ("assistants"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete their assistant configs" ON "public"."assistant_configs" FOR DELETE USING (("id" IN ( SELECT "assistants"."id"
   FROM "public"."assistants"
  WHERE ("assistants"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete their assistant subscriptions" ON "public"."assistant_subscriptions" FOR DELETE USING (("assistant_id" IN ( SELECT "assistants"."id"
   FROM "public"."assistants"
  WHERE ("assistants"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete their assistant usage limits" ON "public"."assistant_usage_limits" FOR DELETE USING (("assistant_id" IN ( SELECT "assistants"."id"
   FROM "public"."assistants"
  WHERE ("assistants"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete their own assistants" ON "public"."assistants" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete their own interactions" ON "public"."interactions" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete their usage statistics" ON "public"."usage_statistics" FOR DELETE USING (((("entity_type" = 'user'::"text") AND ("entity_id" = "auth"."uid"())) OR (("entity_type" = 'assistant'::"text") AND ("entity_id" IN ( SELECT "assistants"."id"
   FROM "public"."assistants"
  WHERE ("assistants"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can insert their assistant activity" ON "public"."assistant_activity" FOR INSERT WITH CHECK (("assistant_id" IN ( SELECT "assistants"."id"
   FROM "public"."assistants"
  WHERE ("assistants"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert their assistant configs" ON "public"."assistant_configs" FOR INSERT WITH CHECK (("id" IN ( SELECT "assistants"."id"
   FROM "public"."assistants"
  WHERE ("assistants"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert their assistant subscriptions" ON "public"."assistant_subscriptions" FOR INSERT WITH CHECK (("assistant_id" IN ( SELECT "assistants"."id"
   FROM "public"."assistants"
  WHERE ("assistants"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert their assistant usage limits" ON "public"."assistant_usage_limits" FOR INSERT WITH CHECK (("assistant_id" IN ( SELECT "assistants"."id"
   FROM "public"."assistants"
  WHERE ("assistants"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert their own assistants" ON "public"."assistants" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own audit logs" ON "public"."audit_logs" FOR INSERT WITH CHECK (("performed_by" = "auth"."uid"()));



CREATE POLICY "Users can insert their own interactions" ON "public"."interactions" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their usage statistics" ON "public"."usage_statistics" FOR INSERT WITH CHECK (((("entity_type" = 'user'::"text") AND ("entity_id" = "auth"."uid"())) OR (("entity_type" = 'assistant'::"text") AND ("entity_id" IN ( SELECT "assistants"."id"
   FROM "public"."assistants"
  WHERE ("assistants"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can update their assigned phone numbers" ON "public"."phone_numbers" FOR UPDATE USING ((("assistant_id" IS NULL) OR ("assistant_id" IN ( SELECT "assistants"."id"
   FROM "public"."assistants"
  WHERE ("assistants"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their assistant activity" ON "public"."assistant_activity" FOR UPDATE USING (("assistant_id" IN ( SELECT "assistants"."id"
   FROM "public"."assistants"
  WHERE ("assistants"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update their assistant configs" ON "public"."assistant_configs" FOR UPDATE USING (("id" IN ( SELECT "assistants"."id"
   FROM "public"."assistants"
  WHERE ("assistants"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update their assistant subscriptions" ON "public"."assistant_subscriptions" FOR UPDATE USING (("assistant_id" IN ( SELECT "assistants"."id"
   FROM "public"."assistants"
  WHERE ("assistants"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update their assistant usage limits" ON "public"."assistant_usage_limits" FOR UPDATE USING (("assistant_id" IN ( SELECT "assistants"."id"
   FROM "public"."assistants"
  WHERE ("assistants"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update their own assistants" ON "public"."assistants" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own interactions" ON "public"."interactions" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their usage statistics" ON "public"."usage_statistics" FOR UPDATE USING (((("entity_type" = 'user'::"text") AND ("entity_id" = "auth"."uid"())) OR (("entity_type" = 'assistant'::"text") AND ("entity_id" IN ( SELECT "assistants"."id"
   FROM "public"."assistants"
  WHERE ("assistants"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view audit logs they created" ON "public"."audit_logs" FOR SELECT USING (("performed_by" = "auth"."uid"()));



CREATE POLICY "Users can view their assigned phone numbers" ON "public"."phone_numbers" FOR SELECT USING ((("assistant_id" IS NULL) OR ("assistant_id" IN ( SELECT "assistants"."id"
   FROM "public"."assistants"
  WHERE ("assistants"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their assistant activity" ON "public"."assistant_activity" FOR SELECT USING (("assistant_id" IN ( SELECT "assistants"."id"
   FROM "public"."assistants"
  WHERE ("assistants"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their assistant configs" ON "public"."assistant_configs" FOR SELECT USING (("id" IN ( SELECT "assistants"."id"
   FROM "public"."assistants"
  WHERE ("assistants"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their assistant subscriptions" ON "public"."assistant_subscriptions" FOR SELECT USING (("assistant_id" IN ( SELECT "assistants"."id"
   FROM "public"."assistants"
  WHERE ("assistants"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their assistant usage limits" ON "public"."assistant_usage_limits" FOR SELECT USING (("assistant_id" IN ( SELECT "assistants"."id"
   FROM "public"."assistants"
  WHERE ("assistants"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their own assistants" ON "public"."assistants" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own interactions" ON "public"."interactions" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own payment sessions" ON "public"."payment_sessions" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their usage statistics" ON "public"."usage_statistics" FOR SELECT USING (((("entity_type" = 'user'::"text") AND ("entity_id" = "auth"."uid"())) OR (("entity_type" = 'assistant'::"text") AND ("entity_id" IN ( SELECT "assistants"."id"
   FROM "public"."assistants"
  WHERE ("assistants"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."assistant_activity" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assistant_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assistant_limits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assistant_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assistant_usage_limits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assistants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."historical_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."phone_numbers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."usage_statistics" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";









GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";









































































































































































































GRANT ALL ON FUNCTION "public"."archive_monthly_usage"() TO "anon";
GRANT ALL ON FUNCTION "public"."archive_monthly_usage"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."archive_monthly_usage"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_audit_logs"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_audit_logs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_audit_logs"() TO "service_role";
GRANT ALL ON FUNCTION "public"."cleanup_old_audit_logs"() TO "admin";



GRANT ALL ON FUNCTION "public"."enforce_message_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_message_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_message_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_feature_access"("p_assistant_id" "uuid", "p_feature" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_feature_access"("p_assistant_id" "uuid", "p_feature" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_feature_access"("p_assistant_id" "uuid", "p_feature" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_plan_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_plan_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_plan_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."provision_twilio_number"("p_phone_number" "text", "p_twilio_sid" "text", "p_friendly_name" "text", "p_country" "text", "p_region" "text", "p_capabilities" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."provision_twilio_number"("p_phone_number" "text", "p_twilio_sid" "text", "p_friendly_name" "text", "p_country" "text", "p_region" "text", "p_capabilities" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."provision_twilio_number"("p_phone_number" "text", "p_twilio_sid" "text", "p_friendly_name" "text", "p_country" "text", "p_region" "text", "p_capabilities" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."provision_twilio_number"("p_phone_number" "text", "p_twilio_sid" "text", "p_friendly_name" "text", "p_country" "text", "p_region" "text", "p_capabilities" "jsonb") TO "admin";



GRANT ALL ON FUNCTION "public"."reset_usage_limits"() TO "anon";
GRANT ALL ON FUNCTION "public"."reset_usage_limits"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."reset_usage_limits"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_payment_sessions_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_payment_sessions_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_payment_sessions_updated_at"() TO "service_role";
GRANT ALL ON FUNCTION "public"."update_payment_sessions_updated_at"() TO "admin";



GRANT ALL ON FUNCTION "public"."update_twilio_webhooks"("p_phone_id" "uuid", "p_voice_url" "text", "p_sms_url" "text", "p_sms_fallback_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_twilio_webhooks"("p_phone_id" "uuid", "p_voice_url" "text", "p_sms_url" "text", "p_sms_fallback_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_twilio_webhooks"("p_phone_id" "uuid", "p_voice_url" "text", "p_sms_url" "text", "p_sms_fallback_url" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."update_twilio_webhooks"("p_phone_id" "uuid", "p_voice_url" "text", "p_sms_url" "text", "p_sms_fallback_url" "text") TO "admin";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "admin";



GRANT ALL ON FUNCTION "public"."update_usage"("p_assistant_id" "uuid", "p_messages" integer, "p_tokens" integer, "p_documents" integer, "p_webpages" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."update_usage"("p_assistant_id" "uuid", "p_messages" integer, "p_tokens" integer, "p_documents" integer, "p_webpages" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_usage"("p_assistant_id" "uuid", "p_messages" integer, "p_tokens" integer, "p_documents" integer, "p_webpages" integer) TO "service_role";

































GRANT ALL ON TABLE "public"."assistant_activity" TO "anon";
GRANT ALL ON TABLE "public"."assistant_activity" TO "authenticated";
GRANT ALL ON TABLE "public"."assistant_activity" TO "service_role";
GRANT ALL ON TABLE "public"."assistant_activity" TO "admin";



GRANT ALL ON TABLE "public"."assistant_configs" TO "anon";
GRANT ALL ON TABLE "public"."assistant_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."assistant_configs" TO "service_role";
GRANT ALL ON TABLE "public"."assistant_configs" TO "admin";



GRANT ALL ON TABLE "public"."assistant_limits" TO "anon";
GRANT ALL ON TABLE "public"."assistant_limits" TO "authenticated";
GRANT ALL ON TABLE "public"."assistant_limits" TO "service_role";



GRANT ALL ON TABLE "public"."assistant_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."assistant_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."assistant_subscriptions" TO "service_role";
GRANT ALL ON TABLE "public"."assistant_subscriptions" TO "admin";



GRANT ALL ON TABLE "public"."assistants" TO "anon";
GRANT ALL ON TABLE "public"."assistants" TO "authenticated";
GRANT ALL ON TABLE "public"."assistants" TO "service_role";
GRANT ALL ON TABLE "public"."assistants" TO "admin";



GRANT ALL ON TABLE "public"."assistant_detail_view" TO "anon";
GRANT ALL ON TABLE "public"."assistant_detail_view" TO "authenticated";
GRANT ALL ON TABLE "public"."assistant_detail_view" TO "service_role";



GRANT ALL ON TABLE "public"."assistant_usage_limits" TO "anon";
GRANT ALL ON TABLE "public"."assistant_usage_limits" TO "authenticated";
GRANT ALL ON TABLE "public"."assistant_usage_limits" TO "service_role";
GRANT ALL ON TABLE "public"."assistant_usage_limits" TO "admin";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";
GRANT ALL ON TABLE "public"."audit_logs" TO "admin";



GRANT ALL ON TABLE "public"."historical_usage" TO "anon";
GRANT ALL ON TABLE "public"."historical_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."historical_usage" TO "service_role";



GRANT ALL ON TABLE "public"."interactions" TO "anon";
GRANT ALL ON TABLE "public"."interactions" TO "authenticated";
GRANT ALL ON TABLE "public"."interactions" TO "service_role";



GRANT ALL ON TABLE "public"."interaction_phone_summary" TO "anon";
GRANT ALL ON TABLE "public"."interaction_phone_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."interaction_phone_summary" TO "service_role";



GRANT ALL ON TABLE "public"."payment_sessions" TO "anon";
GRANT ALL ON TABLE "public"."payment_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_sessions" TO "service_role";
GRANT ALL ON TABLE "public"."payment_sessions" TO "admin";



GRANT ALL ON TABLE "public"."phone_numbers" TO "anon";
GRANT ALL ON TABLE "public"."phone_numbers" TO "authenticated";
GRANT ALL ON TABLE "public"."phone_numbers" TO "service_role";
GRANT ALL ON TABLE "public"."phone_numbers" TO "admin";



GRANT ALL ON TABLE "public"."plan_details" TO "anon";
GRANT ALL ON TABLE "public"."plan_details" TO "authenticated";
GRANT ALL ON TABLE "public"."plan_details" TO "service_role";



GRANT ALL ON TABLE "public"."usage_overview" TO "anon";
GRANT ALL ON TABLE "public"."usage_overview" TO "authenticated";
GRANT ALL ON TABLE "public"."usage_overview" TO "service_role";



GRANT ALL ON TABLE "public"."usage_statistics" TO "anon";
GRANT ALL ON TABLE "public"."usage_statistics" TO "authenticated";
GRANT ALL ON TABLE "public"."usage_statistics" TO "service_role";
GRANT ALL ON TABLE "public"."usage_statistics" TO "admin";









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
