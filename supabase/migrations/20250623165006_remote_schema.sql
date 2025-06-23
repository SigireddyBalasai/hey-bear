create type "public"."country" as enum ('US', 'Canada');

create type "public"."monthly_interval" as enum ('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December');

create type "public"."subscription_status" as enum ('active', 'trialing', 'past_due', 'canceled', 'unpaid');

create table "public"."assistant_activity" (
    "assistant_id" uuid not null,
    "total_messages" integer default 0,
    "total_tokens" integer default 0,
    "total_documents" integer default 0,
    "total_webpages" integer default 0,
    "last_message_at" timestamp with time zone,
    "last_used_at" timestamp with time zone default now(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "last_activity_at" timestamp with time zone,
    "total_interactions" integer
);


alter table "public"."assistant_activity" enable row level security;

create table "public"."assistant_configs" (
    "id" uuid not null,
    "description" text,
    "display_name" text,
    "personality" text,
    "business_name" text,
    "business_phone" text,
    "system_prompt" text,
    "pinecone_name" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "concierge_name" text,
    "share_phone_number" boolean default false,
    "timezone" text default 'UTC'::text,
    "business_hours" jsonb default '{"end": "17:00", "start": "09:00"}'::jsonb,
    "features_enabled" jsonb default '{"analytics": false, "email_support": false, "webhook_access": false, "document_upload": false, "webpage_crawling": false}'::jsonb,
    "webhook_url" text,
    "webhook_enabled" boolean default false
);


alter table "public"."assistant_configs" enable row level security;

create table "public"."assistant_limits" (
    "assistant_id" uuid not null,
    "message_used" integer not null default 0,
    "token_used" integer not null default 0,
    "documents_used" integer not null default 0,
    "webpages_used" integer not null default 0,
    "current_month_messages" integer not null default 0,
    "current_month_tokens" integer not null default 0,
    "current_month_documents" integer not null default 0,
    "current_month_webpages" integer not null default 0,
    "current_period_start" date not null default date_trunc('month'::text, now()),
    "last_reset" timestamp with time zone not null default now(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."assistant_limits" enable row level security;

create table "public"."assistant_subscriptions" (
    "id" uuid not null default gen_random_uuid(),
    "assistant_id" uuid not null,
    "plan_id" text not null,
    "stripe_subscription_id" text,
    "status" subscription_status not null,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "cancel_at_period_end" boolean default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "payment_session_id" uuid,
    "message_limit" integer,
    "document_limit" integer,
    "webpage_limit" integer,
    "plan_name" text,
    "currency" text default 'CAD'::text,
    "price" numeric(10,2),
    "product_id" text,
    "support_level" text default 'basic'::text,
    "support_email" text
);


alter table "public"."assistant_subscriptions" enable row level security;

create table "public"."assistant_usage_limits" (
    "assistant_id" uuid not null,
    "message_limit" integer default 100,
    "token_limit" integer default 100000,
    "document_limit" integer default 5,
    "webpage_limit" integer default 5,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "max_messages" integer,
    "max_tokens" integer
);


alter table "public"."assistant_usage_limits" enable row level security;

create table "public"."assistants" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "name" text not null,
    "is_starred" boolean default false,
    "pending" boolean default false,
    "assigned_phone_number" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "is_active" boolean not null default true
);


alter table "public"."assistants" enable row level security;

create table "public"."audit_logs" (
    "id" uuid not null default gen_random_uuid(),
    "entity_id" uuid not null,
    "entity_type" text not null,
    "action" text not null,
    "action_timestamp" timestamp with time zone not null default now(),
    "performed_by" uuid not null,
    "details" jsonb,
    "created_at" timestamp with time zone not null default now(),
    "related_entity_id" uuid
);


alter table "public"."audit_logs" enable row level security;

create table "public"."historical_usage" (
    "id" uuid not null default gen_random_uuid(),
    "assistant_id" uuid not null,
    "period" date not null,
    "messages_used" integer not null,
    "tokens_used" integer not null,
    "documents_used" integer not null,
    "webpages_used" integer not null,
    "peak_usage_date" timestamp with time zone,
    "avg_daily_messages" numeric(5,2),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."historical_usage" enable row level security;

create table "public"."interactions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "assistant_id" uuid not null,
    "request" jsonb,
    "response" jsonb,
    "chat" jsonb,
    "interaction_time" timestamp with time zone default now(),
    "token_usage" integer,
    "input_tokens" integer,
    "output_tokens" integer,
    "cost_estimate" numeric(10,6),
    "duration" integer,
    "is_error" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "metadata" jsonb default '{}'::jsonb,
    "status" text default 'completed'::text,
    "error_message" text,
    "source" text,
    "model" text,
    "session_id" uuid
);


alter table "public"."interactions" enable row level security;

create table "public"."payment_sessions" (
    "id" uuid not null default gen_random_uuid(),
    "session_id" text not null,
    "user_id" uuid,
    "assistant_config_data" jsonb not null,
    "stripe_checkout_session_id" text,
    "stripe_customer_id" text,
    "plan_id" text,
    "amount_total" integer,
    "currency" text default 'usd'::text,
    "customer_email" text,
    "status" text not null default 'pending'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "expires_at" timestamp with time zone
);


alter table "public"."payment_sessions" enable row level security;

create table "public"."phone_numbers" (
    "id" uuid not null default gen_random_uuid(),
    "phone_number" text not null,
    "assistant_id" uuid,
    "country" text,
    "status" text default 'available'::text,
    "is_assigned" boolean default false,
    "capabilities" jsonb default '{"mms": false, "sms": true, "voice": true}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "twilio_sid" text,
    "messaging_service_sid" text,
    "voice_url" text,
    "sms_url" text,
    "sms_fallback_url" text,
    "capabilities_enabled" jsonb default '{"mms": false, "sms": false, "voice": false}'::jsonb
);


alter table "public"."phone_numbers" enable row level security;

create table "public"."usage_statistics" (
    "id" uuid not null default gen_random_uuid(),
    "entity_id" uuid not null,
    "entity_type" text not null,
    "period" date,
    "messages_count" integer default 0,
    "interactions_count" integer default 0,
    "token_usage" integer default 0,
    "input_tokens" integer default 0,
    "output_tokens" integer default 0,
    "cost_estimate" numeric(10,4) default 0,
    "last_activity" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."usage_statistics" enable row level security;

CREATE INDEX assistant_activity_last_message_at_idx ON public.assistant_activity USING btree (last_message_at DESC);

CREATE INDEX assistant_activity_last_used_at_idx ON public.assistant_activity USING btree (last_used_at);

CREATE INDEX assistant_activity_last_used_at_idx1 ON public.assistant_activity USING btree (last_used_at DESC);

CREATE UNIQUE INDEX assistant_activity_pkey ON public.assistant_activity USING btree (assistant_id);

CREATE INDEX assistant_configs_business_name_idx ON public.assistant_configs USING btree (business_name);

CREATE UNIQUE INDEX assistant_configs_pinecone_name_key ON public.assistant_configs USING btree (pinecone_name);

CREATE UNIQUE INDEX assistant_configs_pkey ON public.assistant_configs USING btree (id);

CREATE UNIQUE INDEX assistant_limits_pkey ON public.assistant_limits USING btree (assistant_id);

CREATE UNIQUE INDEX assistant_subscriptions_assistant_id_key ON public.assistant_subscriptions USING btree (assistant_id);

CREATE UNIQUE INDEX assistant_subscriptions_pkey ON public.assistant_subscriptions USING btree (id);

CREATE INDEX assistant_subscriptions_status_idx ON public.assistant_subscriptions USING btree (status);

CREATE UNIQUE INDEX assistant_subscriptions_stripe_subscription_id_key ON public.assistant_subscriptions USING btree (stripe_subscription_id);

CREATE UNIQUE INDEX assistant_usage_limits_pkey ON public.assistant_usage_limits USING btree (assistant_id);

CREATE INDEX assistants_name_idx ON public.assistants USING btree (name);

CREATE INDEX assistants_pending_idx ON public.assistants USING btree (pending) WHERE (pending = true);

CREATE UNIQUE INDEX assistants_pkey ON public.assistants USING btree (id);

CREATE INDEX assistants_user_id_created_at_idx ON public.assistants USING btree (user_id, created_at DESC);

CREATE INDEX assistants_user_id_idx ON public.assistants USING btree (user_id);

CREATE INDEX audit_logs_entity_action_idx ON public.audit_logs USING btree (entity_type, entity_id, action_timestamp DESC);

CREATE INDEX audit_logs_performer_idx ON public.audit_logs USING btree (performed_by, action_timestamp DESC);

CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id);

CREATE UNIQUE INDEX historical_usage_assistant_id_period_key ON public.historical_usage USING btree (assistant_id, period);

CREATE UNIQUE INDEX historical_usage_pkey ON public.historical_usage USING btree (id);

CREATE INDEX idx_assistant_activity_assistant_id ON public.assistant_activity USING btree (assistant_id);

CREATE INDEX idx_assistant_configs_id ON public.assistant_configs USING btree (id);

CREATE INDEX idx_assistant_subscriptions_assistant_id ON public.assistant_subscriptions USING btree (assistant_id);

CREATE INDEX idx_assistant_subscriptions_payment_session ON public.assistant_subscriptions USING btree (payment_session_id);

CREATE INDEX idx_assistant_usage_limits_assistant_id ON public.assistant_usage_limits USING btree (assistant_id);

CREATE INDEX idx_assistants_active ON public.assistants USING btree (is_active) WHERE (is_active = true);

CREATE INDEX idx_historical_usage_assistant ON public.historical_usage USING btree (assistant_id, period);

CREATE INDEX idx_historical_usage_period ON public.historical_usage USING btree (period);

CREATE INDEX idx_interactions_session ON public.interactions USING btree (session_id);

CREATE INDEX idx_limits_assistant ON public.assistant_limits USING btree (assistant_id);

CREATE INDEX idx_payment_sessions_created_at ON public.payment_sessions USING btree (created_at);

CREATE INDEX idx_payment_sessions_expires_at ON public.payment_sessions USING btree (expires_at);

CREATE INDEX idx_payment_sessions_session_id ON public.payment_sessions USING btree (session_id);

CREATE INDEX idx_payment_sessions_status ON public.payment_sessions USING btree (status);

CREATE INDEX idx_payment_sessions_user_id ON public.payment_sessions USING btree (user_id);

CREATE INDEX idx_phone_numbers_is_assigned ON public.phone_numbers USING btree (is_assigned);

CREATE INDEX idx_phone_numbers_phone_number ON public.phone_numbers USING btree (phone_number);

CREATE INDEX idx_phone_numbers_unassigned ON public.phone_numbers USING btree (id, created_at) WHERE (is_assigned = false);

CREATE INDEX idx_phone_status ON public.phone_numbers USING btree (status);

CREATE INDEX idx_usage_statistics_entity ON public.usage_statistics USING btree (entity_id, entity_type);

CREATE INDEX idx_usage_statistics_entity_type_entity_id ON public.usage_statistics USING btree (entity_type, entity_id);

CREATE INDEX idx_usage_statistics_period ON public.usage_statistics USING btree (period);

CREATE INDEX idx_usage_statistics_period_entity_type ON public.usage_statistics USING btree (period, entity_type);

CREATE INDEX interactions_assistant_id_idx ON public.interactions USING btree (assistant_id);

CREATE INDEX interactions_interaction_time_idx ON public.interactions USING btree (interaction_time);

CREATE INDEX interactions_metadata_gin_idx ON public.interactions USING gin (metadata);

CREATE UNIQUE INDEX interactions_pkey ON public.interactions USING btree (id);

CREATE INDEX interactions_status_idx ON public.interactions USING btree (status);

CREATE INDEX interactions_user_id_idx ON public.interactions USING btree (user_id);

CREATE UNIQUE INDEX payment_sessions_pkey ON public.payment_sessions USING btree (id);

CREATE UNIQUE INDEX payment_sessions_session_id_key ON public.payment_sessions USING btree (session_id);

CREATE INDEX phone_numbers_assistant_id_idx ON public.phone_numbers USING btree (assistant_id);

CREATE UNIQUE INDEX phone_numbers_phone_number_key ON public.phone_numbers USING btree (phone_number);

CREATE UNIQUE INDEX phone_numbers_pkey ON public.phone_numbers USING btree (id);

CREATE INDEX usage_statistics_entity_period_idx ON public.usage_statistics USING btree (entity_type, entity_id, period);

CREATE UNIQUE INDEX usage_statistics_entity_period_unique ON public.usage_statistics USING btree (entity_id, entity_type, period);

CREATE UNIQUE INDEX usage_statistics_pkey ON public.usage_statistics USING btree (id);

alter table "public"."assistant_activity" add constraint "assistant_activity_pkey" PRIMARY KEY using index "assistant_activity_pkey";

alter table "public"."assistant_configs" add constraint "assistant_configs_pkey" PRIMARY KEY using index "assistant_configs_pkey";

alter table "public"."assistant_limits" add constraint "assistant_limits_pkey" PRIMARY KEY using index "assistant_limits_pkey";

alter table "public"."assistant_subscriptions" add constraint "assistant_subscriptions_pkey" PRIMARY KEY using index "assistant_subscriptions_pkey";

alter table "public"."assistant_usage_limits" add constraint "assistant_usage_limits_pkey" PRIMARY KEY using index "assistant_usage_limits_pkey";

alter table "public"."assistants" add constraint "assistants_pkey" PRIMARY KEY using index "assistants_pkey";

alter table "public"."audit_logs" add constraint "audit_logs_pkey" PRIMARY KEY using index "audit_logs_pkey";

alter table "public"."historical_usage" add constraint "historical_usage_pkey" PRIMARY KEY using index "historical_usage_pkey";

alter table "public"."interactions" add constraint "interactions_pkey" PRIMARY KEY using index "interactions_pkey";

alter table "public"."payment_sessions" add constraint "payment_sessions_pkey" PRIMARY KEY using index "payment_sessions_pkey";

alter table "public"."phone_numbers" add constraint "phone_numbers_pkey" PRIMARY KEY using index "phone_numbers_pkey";

alter table "public"."usage_statistics" add constraint "usage_statistics_pkey" PRIMARY KEY using index "usage_statistics_pkey";

alter table "public"."assistant_activity" add constraint "assistant_activity_assistant_id_fkey" FOREIGN KEY (assistant_id) REFERENCES assistants(id) ON DELETE CASCADE not valid;

alter table "public"."assistant_activity" validate constraint "assistant_activity_assistant_id_fkey";

alter table "public"."assistant_configs" add constraint "assistant_configs_id_fkey" FOREIGN KEY (id) REFERENCES assistants(id) ON DELETE CASCADE not valid;

alter table "public"."assistant_configs" validate constraint "assistant_configs_id_fkey";

alter table "public"."assistant_configs" add constraint "assistant_configs_pinecone_name_key" UNIQUE using index "assistant_configs_pinecone_name_key";

alter table "public"."assistant_limits" add constraint "assistant_limits_assistant_id_fkey" FOREIGN KEY (assistant_id) REFERENCES assistants(id) ON DELETE CASCADE not valid;

alter table "public"."assistant_limits" validate constraint "assistant_limits_assistant_id_fkey";

alter table "public"."assistant_subscriptions" add constraint "assistant_subscriptions_assistant_id_fkey" FOREIGN KEY (assistant_id) REFERENCES assistants(id) ON DELETE CASCADE not valid;

alter table "public"."assistant_subscriptions" validate constraint "assistant_subscriptions_assistant_id_fkey";

alter table "public"."assistant_subscriptions" add constraint "assistant_subscriptions_assistant_id_key" UNIQUE using index "assistant_subscriptions_assistant_id_key";

alter table "public"."assistant_subscriptions" add constraint "assistant_subscriptions_payment_session_id_fkey" FOREIGN KEY (payment_session_id) REFERENCES payment_sessions(id) ON DELETE SET NULL not valid;

alter table "public"."assistant_subscriptions" validate constraint "assistant_subscriptions_payment_session_id_fkey";

alter table "public"."assistant_subscriptions" add constraint "assistant_subscriptions_stripe_subscription_id_key" UNIQUE using index "assistant_subscriptions_stripe_subscription_id_key";

alter table "public"."assistant_usage_limits" add constraint "assistant_usage_limits_assistant_id_fkey" FOREIGN KEY (assistant_id) REFERENCES assistants(id) ON DELETE CASCADE not valid;

alter table "public"."assistant_usage_limits" validate constraint "assistant_usage_limits_assistant_id_fkey";

alter table "public"."historical_usage" add constraint "historical_usage_assistant_id_fkey" FOREIGN KEY (assistant_id) REFERENCES assistants(id) ON DELETE CASCADE not valid;

alter table "public"."historical_usage" validate constraint "historical_usage_assistant_id_fkey";

alter table "public"."historical_usage" add constraint "historical_usage_assistant_id_period_key" UNIQUE using index "historical_usage_assistant_id_period_key";

alter table "public"."interactions" add constraint "interactions_source_check" CHECK ((source = ANY (ARRAY['sms'::text, 'voice'::text, 'web'::text, 'api'::text]))) not valid;

alter table "public"."interactions" validate constraint "interactions_source_check";

alter table "public"."interactions" add constraint "interactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."interactions" validate constraint "interactions_user_id_fkey";

alter table "public"."payment_sessions" add constraint "payment_sessions_session_id_key" UNIQUE using index "payment_sessions_session_id_key";

alter table "public"."payment_sessions" add constraint "payment_sessions_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'expired'::text, 'cancelled'::text]))) not valid;

alter table "public"."payment_sessions" validate constraint "payment_sessions_status_check";

alter table "public"."phone_numbers" add constraint "phone_number_format_check" CHECK ((phone_number ~ '^\+\d{1,15}$'::text)) not valid;

alter table "public"."phone_numbers" validate constraint "phone_number_format_check";

alter table "public"."phone_numbers" add constraint "phone_numbers_assistant_id_fkey" FOREIGN KEY (assistant_id) REFERENCES assistants(id) ON DELETE SET NULL not valid;

alter table "public"."phone_numbers" validate constraint "phone_numbers_assistant_id_fkey";

alter table "public"."phone_numbers" add constraint "phone_numbers_phone_number_key" UNIQUE using index "phone_numbers_phone_number_key";

alter table "public"."phone_numbers" add constraint "status_check" CHECK ((status = ANY (ARRAY['available'::text, 'assigned'::text, 'pending'::text, 'suspended'::text]))) not valid;

alter table "public"."phone_numbers" validate constraint "status_check";

alter table "public"."usage_statistics" add constraint "usage_statistics_entity_period_unique" UNIQUE using index "usage_statistics_entity_period_unique";

alter table "public"."usage_statistics" add constraint "usage_statistics_entity_type_check" CHECK ((entity_type = ANY (ARRAY['assistant'::text, 'user'::text]))) not valid;

alter table "public"."usage_statistics" validate constraint "usage_statistics_entity_type_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.archive_monthly_usage()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

create or replace view "public"."assistant_detail_view" as  SELECT a.id,
    a.name AS assistant_name,
    a.user_id,
    a.is_active,
    a.created_at AS assistant_created_at,
    a.updated_at AS assistant_updated_at,
    ac.system_prompt,
    ac.description,
    ac.business_name,
    ac.pinecone_name,
    ac.display_name,
    ac.personality,
    ac.features_enabled,
    ac.webhook_enabled,
    ac.created_at AS config_created_at,
    ac.updated_at AS config_updated_at,
    act.last_activity_at,
    act.total_interactions,
    sub.plan_id,
    sub.plan_name,
    sub.status AS subscription_status,
    sub.current_period_end,
    sub.message_limit,
    sub.document_limit,
    sub.webpage_limit,
    lim.message_used,
    lim.token_used
   FROM ((((assistants a
     LEFT JOIN assistant_configs ac ON ((a.id = ac.id)))
     LEFT JOIN assistant_activity act ON ((a.id = act.assistant_id)))
     LEFT JOIN assistant_subscriptions sub ON ((a.id = sub.assistant_id)))
     LEFT JOIN assistant_limits lim ON ((a.id = lim.assistant_id)));


CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    DELETE FROM public.audit_logs
    WHERE action_timestamp < NOW() - INTERVAL '90 days';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table public.audit_logs does not exist yet';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning up audit logs: %', SQLERRM;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.enforce_message_limit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.has_feature_access(p_assistant_id uuid, p_feature text)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
    has_access BOOLEAN;
BEGIN
    SELECT features_enabled->>p_feature = 'true'
    INTO has_access
    FROM public.assistant_configs
    WHERE id = p_assistant_id;
    
    RETURN COALESCE(has_access, false);
END;
$function$
;

create materialized view "public"."interaction_phone_summary" as  SELECT interactions.assistant_id,
    (interactions.metadata ->> 'phone_number'::text) AS phone,
    count(*) AS total_calls,
    avg(interactions.duration) AS avg_duration
   FROM interactions
  WHERE (interactions.metadata ? 'phone_number'::text)
  GROUP BY interactions.assistant_id, (interactions.metadata ->> 'phone_number'::text);


CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if the 'is_admin' custom claim is true in the JWT
  RETURN (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean IS TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- If claim is not present or any other error, not an admin
    RETURN FALSE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_plan_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

create or replace view "public"."plan_details" as  SELECT s.assistant_id,
    s.product_id,
    s.plan_name,
    s.price,
    s.currency,
    s.message_limit,
    s.document_limit,
    s.webpage_limit,
    c.features_enabled,
    p.capabilities_enabled,
    s.support_level,
    s.support_email
   FROM ((assistant_subscriptions s
     JOIN assistant_configs c ON ((s.assistant_id = c.id)))
     LEFT JOIN phone_numbers p ON ((s.assistant_id = p.assistant_id)));


CREATE OR REPLACE FUNCTION public.provision_twilio_number(p_phone_number text, p_twilio_sid text, p_friendly_name text DEFAULT NULL::text, p_country text DEFAULT 'US'::text, p_region text DEFAULT NULL::text, p_capabilities jsonb DEFAULT '{"sms": true, "voice": true}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.reset_usage_limits()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_payment_sessions_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_twilio_webhooks(p_phone_id uuid, p_voice_url text DEFAULT NULL::text, p_sms_url text DEFAULT NULL::text, p_sms_fallback_url text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_usage(p_assistant_id uuid, p_messages integer DEFAULT 0, p_tokens integer DEFAULT 0, p_documents integer DEFAULT 0, p_webpages integer DEFAULT 0)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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
$function$
;

create or replace view "public"."usage_overview" as  SELECT a.id AS assistant_id,
    a.name AS assistant_name,
    s.plan_name,
    s.message_limit,
    s.document_limit,
    s.webpage_limit,
    lim.message_used,
    lim.token_used,
    lim.documents_used,
    lim.webpages_used,
    (s.message_limit - lim.message_used) AS messages_remaining,
    (s.document_limit - lim.documents_used) AS documents_remaining,
    (s.webpage_limit - lim.webpages_used) AS webpages_remaining,
    lim.current_month_messages,
    lim.current_month_tokens
   FROM ((assistants a
     LEFT JOIN assistant_limits lim ON ((a.id = lim.assistant_id)))
     LEFT JOIN assistant_subscriptions s ON ((a.id = s.assistant_id)));


grant delete on table "public"."assistant_activity" to "admin";

grant insert on table "public"."assistant_activity" to "admin";

grant references on table "public"."assistant_activity" to "admin";

grant select on table "public"."assistant_activity" to "admin";

grant trigger on table "public"."assistant_activity" to "admin";

grant truncate on table "public"."assistant_activity" to "admin";

grant update on table "public"."assistant_activity" to "admin";

grant delete on table "public"."assistant_activity" to "anon";

grant insert on table "public"."assistant_activity" to "anon";

grant references on table "public"."assistant_activity" to "anon";

grant select on table "public"."assistant_activity" to "anon";

grant trigger on table "public"."assistant_activity" to "anon";

grant truncate on table "public"."assistant_activity" to "anon";

grant update on table "public"."assistant_activity" to "anon";

grant delete on table "public"."assistant_activity" to "authenticated";

grant insert on table "public"."assistant_activity" to "authenticated";

grant references on table "public"."assistant_activity" to "authenticated";

grant select on table "public"."assistant_activity" to "authenticated";

grant trigger on table "public"."assistant_activity" to "authenticated";

grant truncate on table "public"."assistant_activity" to "authenticated";

grant update on table "public"."assistant_activity" to "authenticated";

grant delete on table "public"."assistant_activity" to "service_role";

grant insert on table "public"."assistant_activity" to "service_role";

grant references on table "public"."assistant_activity" to "service_role";

grant select on table "public"."assistant_activity" to "service_role";

grant trigger on table "public"."assistant_activity" to "service_role";

grant truncate on table "public"."assistant_activity" to "service_role";

grant update on table "public"."assistant_activity" to "service_role";

grant delete on table "public"."assistant_configs" to "admin";

grant insert on table "public"."assistant_configs" to "admin";

grant references on table "public"."assistant_configs" to "admin";

grant select on table "public"."assistant_configs" to "admin";

grant trigger on table "public"."assistant_configs" to "admin";

grant truncate on table "public"."assistant_configs" to "admin";

grant update on table "public"."assistant_configs" to "admin";

grant delete on table "public"."assistant_configs" to "anon";

grant insert on table "public"."assistant_configs" to "anon";

grant references on table "public"."assistant_configs" to "anon";

grant select on table "public"."assistant_configs" to "anon";

grant trigger on table "public"."assistant_configs" to "anon";

grant truncate on table "public"."assistant_configs" to "anon";

grant update on table "public"."assistant_configs" to "anon";

grant delete on table "public"."assistant_configs" to "authenticated";

grant insert on table "public"."assistant_configs" to "authenticated";

grant references on table "public"."assistant_configs" to "authenticated";

grant select on table "public"."assistant_configs" to "authenticated";

grant trigger on table "public"."assistant_configs" to "authenticated";

grant truncate on table "public"."assistant_configs" to "authenticated";

grant update on table "public"."assistant_configs" to "authenticated";

grant delete on table "public"."assistant_configs" to "service_role";

grant insert on table "public"."assistant_configs" to "service_role";

grant references on table "public"."assistant_configs" to "service_role";

grant select on table "public"."assistant_configs" to "service_role";

grant trigger on table "public"."assistant_configs" to "service_role";

grant truncate on table "public"."assistant_configs" to "service_role";

grant update on table "public"."assistant_configs" to "service_role";

grant delete on table "public"."assistant_limits" to "anon";

grant insert on table "public"."assistant_limits" to "anon";

grant references on table "public"."assistant_limits" to "anon";

grant select on table "public"."assistant_limits" to "anon";

grant trigger on table "public"."assistant_limits" to "anon";

grant truncate on table "public"."assistant_limits" to "anon";

grant update on table "public"."assistant_limits" to "anon";

grant delete on table "public"."assistant_limits" to "authenticated";

grant insert on table "public"."assistant_limits" to "authenticated";

grant references on table "public"."assistant_limits" to "authenticated";

grant select on table "public"."assistant_limits" to "authenticated";

grant trigger on table "public"."assistant_limits" to "authenticated";

grant truncate on table "public"."assistant_limits" to "authenticated";

grant update on table "public"."assistant_limits" to "authenticated";

grant delete on table "public"."assistant_limits" to "service_role";

grant insert on table "public"."assistant_limits" to "service_role";

grant references on table "public"."assistant_limits" to "service_role";

grant select on table "public"."assistant_limits" to "service_role";

grant trigger on table "public"."assistant_limits" to "service_role";

grant truncate on table "public"."assistant_limits" to "service_role";

grant update on table "public"."assistant_limits" to "service_role";

grant delete on table "public"."assistant_subscriptions" to "admin";

grant insert on table "public"."assistant_subscriptions" to "admin";

grant references on table "public"."assistant_subscriptions" to "admin";

grant select on table "public"."assistant_subscriptions" to "admin";

grant trigger on table "public"."assistant_subscriptions" to "admin";

grant truncate on table "public"."assistant_subscriptions" to "admin";

grant update on table "public"."assistant_subscriptions" to "admin";

grant delete on table "public"."assistant_subscriptions" to "anon";

grant insert on table "public"."assistant_subscriptions" to "anon";

grant references on table "public"."assistant_subscriptions" to "anon";

grant select on table "public"."assistant_subscriptions" to "anon";

grant trigger on table "public"."assistant_subscriptions" to "anon";

grant truncate on table "public"."assistant_subscriptions" to "anon";

grant update on table "public"."assistant_subscriptions" to "anon";

grant delete on table "public"."assistant_subscriptions" to "authenticated";

grant insert on table "public"."assistant_subscriptions" to "authenticated";

grant references on table "public"."assistant_subscriptions" to "authenticated";

grant select on table "public"."assistant_subscriptions" to "authenticated";

grant trigger on table "public"."assistant_subscriptions" to "authenticated";

grant truncate on table "public"."assistant_subscriptions" to "authenticated";

grant update on table "public"."assistant_subscriptions" to "authenticated";

grant delete on table "public"."assistant_subscriptions" to "service_role";

grant insert on table "public"."assistant_subscriptions" to "service_role";

grant references on table "public"."assistant_subscriptions" to "service_role";

grant select on table "public"."assistant_subscriptions" to "service_role";

grant trigger on table "public"."assistant_subscriptions" to "service_role";

grant truncate on table "public"."assistant_subscriptions" to "service_role";

grant update on table "public"."assistant_subscriptions" to "service_role";

grant delete on table "public"."assistant_usage_limits" to "admin";

grant insert on table "public"."assistant_usage_limits" to "admin";

grant references on table "public"."assistant_usage_limits" to "admin";

grant select on table "public"."assistant_usage_limits" to "admin";

grant trigger on table "public"."assistant_usage_limits" to "admin";

grant truncate on table "public"."assistant_usage_limits" to "admin";

grant update on table "public"."assistant_usage_limits" to "admin";

grant delete on table "public"."assistant_usage_limits" to "anon";

grant insert on table "public"."assistant_usage_limits" to "anon";

grant references on table "public"."assistant_usage_limits" to "anon";

grant select on table "public"."assistant_usage_limits" to "anon";

grant trigger on table "public"."assistant_usage_limits" to "anon";

grant truncate on table "public"."assistant_usage_limits" to "anon";

grant update on table "public"."assistant_usage_limits" to "anon";

grant delete on table "public"."assistant_usage_limits" to "authenticated";

grant insert on table "public"."assistant_usage_limits" to "authenticated";

grant references on table "public"."assistant_usage_limits" to "authenticated";

grant select on table "public"."assistant_usage_limits" to "authenticated";

grant trigger on table "public"."assistant_usage_limits" to "authenticated";

grant truncate on table "public"."assistant_usage_limits" to "authenticated";

grant update on table "public"."assistant_usage_limits" to "authenticated";

grant delete on table "public"."assistant_usage_limits" to "service_role";

grant insert on table "public"."assistant_usage_limits" to "service_role";

grant references on table "public"."assistant_usage_limits" to "service_role";

grant select on table "public"."assistant_usage_limits" to "service_role";

grant trigger on table "public"."assistant_usage_limits" to "service_role";

grant truncate on table "public"."assistant_usage_limits" to "service_role";

grant update on table "public"."assistant_usage_limits" to "service_role";

grant delete on table "public"."assistants" to "admin";

grant insert on table "public"."assistants" to "admin";

grant references on table "public"."assistants" to "admin";

grant select on table "public"."assistants" to "admin";

grant trigger on table "public"."assistants" to "admin";

grant truncate on table "public"."assistants" to "admin";

grant update on table "public"."assistants" to "admin";

grant delete on table "public"."assistants" to "anon";

grant insert on table "public"."assistants" to "anon";

grant references on table "public"."assistants" to "anon";

grant select on table "public"."assistants" to "anon";

grant trigger on table "public"."assistants" to "anon";

grant truncate on table "public"."assistants" to "anon";

grant update on table "public"."assistants" to "anon";

grant delete on table "public"."assistants" to "authenticated";

grant insert on table "public"."assistants" to "authenticated";

grant references on table "public"."assistants" to "authenticated";

grant select on table "public"."assistants" to "authenticated";

grant trigger on table "public"."assistants" to "authenticated";

grant truncate on table "public"."assistants" to "authenticated";

grant update on table "public"."assistants" to "authenticated";

grant delete on table "public"."assistants" to "service_role";

grant insert on table "public"."assistants" to "service_role";

grant references on table "public"."assistants" to "service_role";

grant select on table "public"."assistants" to "service_role";

grant trigger on table "public"."assistants" to "service_role";

grant truncate on table "public"."assistants" to "service_role";

grant update on table "public"."assistants" to "service_role";

grant delete on table "public"."audit_logs" to "admin";

grant insert on table "public"."audit_logs" to "admin";

grant references on table "public"."audit_logs" to "admin";

grant select on table "public"."audit_logs" to "admin";

grant trigger on table "public"."audit_logs" to "admin";

grant truncate on table "public"."audit_logs" to "admin";

grant update on table "public"."audit_logs" to "admin";

grant delete on table "public"."audit_logs" to "anon";

grant insert on table "public"."audit_logs" to "anon";

grant references on table "public"."audit_logs" to "anon";

grant select on table "public"."audit_logs" to "anon";

grant trigger on table "public"."audit_logs" to "anon";

grant truncate on table "public"."audit_logs" to "anon";

grant update on table "public"."audit_logs" to "anon";

grant delete on table "public"."audit_logs" to "authenticated";

grant insert on table "public"."audit_logs" to "authenticated";

grant references on table "public"."audit_logs" to "authenticated";

grant select on table "public"."audit_logs" to "authenticated";

grant trigger on table "public"."audit_logs" to "authenticated";

grant truncate on table "public"."audit_logs" to "authenticated";

grant update on table "public"."audit_logs" to "authenticated";

grant delete on table "public"."audit_logs" to "service_role";

grant insert on table "public"."audit_logs" to "service_role";

grant references on table "public"."audit_logs" to "service_role";

grant select on table "public"."audit_logs" to "service_role";

grant trigger on table "public"."audit_logs" to "service_role";

grant truncate on table "public"."audit_logs" to "service_role";

grant update on table "public"."audit_logs" to "service_role";

grant delete on table "public"."historical_usage" to "anon";

grant insert on table "public"."historical_usage" to "anon";

grant references on table "public"."historical_usage" to "anon";

grant select on table "public"."historical_usage" to "anon";

grant trigger on table "public"."historical_usage" to "anon";

grant truncate on table "public"."historical_usage" to "anon";

grant update on table "public"."historical_usage" to "anon";

grant delete on table "public"."historical_usage" to "authenticated";

grant insert on table "public"."historical_usage" to "authenticated";

grant references on table "public"."historical_usage" to "authenticated";

grant select on table "public"."historical_usage" to "authenticated";

grant trigger on table "public"."historical_usage" to "authenticated";

grant truncate on table "public"."historical_usage" to "authenticated";

grant update on table "public"."historical_usage" to "authenticated";

grant delete on table "public"."historical_usage" to "service_role";

grant insert on table "public"."historical_usage" to "service_role";

grant references on table "public"."historical_usage" to "service_role";

grant select on table "public"."historical_usage" to "service_role";

grant trigger on table "public"."historical_usage" to "service_role";

grant truncate on table "public"."historical_usage" to "service_role";

grant update on table "public"."historical_usage" to "service_role";

grant delete on table "public"."interactions" to "anon";

grant insert on table "public"."interactions" to "anon";

grant references on table "public"."interactions" to "anon";

grant select on table "public"."interactions" to "anon";

grant trigger on table "public"."interactions" to "anon";

grant truncate on table "public"."interactions" to "anon";

grant update on table "public"."interactions" to "anon";

grant delete on table "public"."interactions" to "authenticated";

grant insert on table "public"."interactions" to "authenticated";

grant references on table "public"."interactions" to "authenticated";

grant select on table "public"."interactions" to "authenticated";

grant trigger on table "public"."interactions" to "authenticated";

grant truncate on table "public"."interactions" to "authenticated";

grant update on table "public"."interactions" to "authenticated";

grant delete on table "public"."interactions" to "service_role";

grant insert on table "public"."interactions" to "service_role";

grant references on table "public"."interactions" to "service_role";

grant select on table "public"."interactions" to "service_role";

grant trigger on table "public"."interactions" to "service_role";

grant truncate on table "public"."interactions" to "service_role";

grant update on table "public"."interactions" to "service_role";

grant delete on table "public"."payment_sessions" to "admin";

grant insert on table "public"."payment_sessions" to "admin";

grant references on table "public"."payment_sessions" to "admin";

grant select on table "public"."payment_sessions" to "admin";

grant trigger on table "public"."payment_sessions" to "admin";

grant truncate on table "public"."payment_sessions" to "admin";

grant update on table "public"."payment_sessions" to "admin";

grant delete on table "public"."payment_sessions" to "anon";

grant insert on table "public"."payment_sessions" to "anon";

grant references on table "public"."payment_sessions" to "anon";

grant select on table "public"."payment_sessions" to "anon";

grant trigger on table "public"."payment_sessions" to "anon";

grant truncate on table "public"."payment_sessions" to "anon";

grant update on table "public"."payment_sessions" to "anon";

grant delete on table "public"."payment_sessions" to "authenticated";

grant insert on table "public"."payment_sessions" to "authenticated";

grant references on table "public"."payment_sessions" to "authenticated";

grant select on table "public"."payment_sessions" to "authenticated";

grant trigger on table "public"."payment_sessions" to "authenticated";

grant truncate on table "public"."payment_sessions" to "authenticated";

grant update on table "public"."payment_sessions" to "authenticated";

grant delete on table "public"."payment_sessions" to "service_role";

grant insert on table "public"."payment_sessions" to "service_role";

grant references on table "public"."payment_sessions" to "service_role";

grant select on table "public"."payment_sessions" to "service_role";

grant trigger on table "public"."payment_sessions" to "service_role";

grant truncate on table "public"."payment_sessions" to "service_role";

grant update on table "public"."payment_sessions" to "service_role";

grant delete on table "public"."phone_numbers" to "admin";

grant insert on table "public"."phone_numbers" to "admin";

grant references on table "public"."phone_numbers" to "admin";

grant select on table "public"."phone_numbers" to "admin";

grant trigger on table "public"."phone_numbers" to "admin";

grant truncate on table "public"."phone_numbers" to "admin";

grant update on table "public"."phone_numbers" to "admin";

grant delete on table "public"."phone_numbers" to "anon";

grant insert on table "public"."phone_numbers" to "anon";

grant references on table "public"."phone_numbers" to "anon";

grant select on table "public"."phone_numbers" to "anon";

grant trigger on table "public"."phone_numbers" to "anon";

grant truncate on table "public"."phone_numbers" to "anon";

grant update on table "public"."phone_numbers" to "anon";

grant delete on table "public"."phone_numbers" to "authenticated";

grant insert on table "public"."phone_numbers" to "authenticated";

grant references on table "public"."phone_numbers" to "authenticated";

grant select on table "public"."phone_numbers" to "authenticated";

grant trigger on table "public"."phone_numbers" to "authenticated";

grant truncate on table "public"."phone_numbers" to "authenticated";

grant update on table "public"."phone_numbers" to "authenticated";

grant delete on table "public"."phone_numbers" to "service_role";

grant insert on table "public"."phone_numbers" to "service_role";

grant references on table "public"."phone_numbers" to "service_role";

grant select on table "public"."phone_numbers" to "service_role";

grant trigger on table "public"."phone_numbers" to "service_role";

grant truncate on table "public"."phone_numbers" to "service_role";

grant update on table "public"."phone_numbers" to "service_role";

grant delete on table "public"."usage_statistics" to "admin";

grant insert on table "public"."usage_statistics" to "admin";

grant references on table "public"."usage_statistics" to "admin";

grant select on table "public"."usage_statistics" to "admin";

grant trigger on table "public"."usage_statistics" to "admin";

grant truncate on table "public"."usage_statistics" to "admin";

grant update on table "public"."usage_statistics" to "admin";

grant delete on table "public"."usage_statistics" to "anon";

grant insert on table "public"."usage_statistics" to "anon";

grant references on table "public"."usage_statistics" to "anon";

grant select on table "public"."usage_statistics" to "anon";

grant trigger on table "public"."usage_statistics" to "anon";

grant truncate on table "public"."usage_statistics" to "anon";

grant update on table "public"."usage_statistics" to "anon";

grant delete on table "public"."usage_statistics" to "authenticated";

grant insert on table "public"."usage_statistics" to "authenticated";

grant references on table "public"."usage_statistics" to "authenticated";

grant select on table "public"."usage_statistics" to "authenticated";

grant trigger on table "public"."usage_statistics" to "authenticated";

grant truncate on table "public"."usage_statistics" to "authenticated";

grant update on table "public"."usage_statistics" to "authenticated";

grant delete on table "public"."usage_statistics" to "service_role";

grant insert on table "public"."usage_statistics" to "service_role";

grant references on table "public"."usage_statistics" to "service_role";

grant select on table "public"."usage_statistics" to "service_role";

grant trigger on table "public"."usage_statistics" to "service_role";

grant truncate on table "public"."usage_statistics" to "service_role";

grant update on table "public"."usage_statistics" to "service_role";

create policy "Users can delete their assistant activity"
on "public"."assistant_activity"
as permissive
for delete
to public
using ((assistant_id IN ( SELECT assistants.id
   FROM assistants
  WHERE (assistants.user_id = auth.uid()))));


create policy "Users can insert their assistant activity"
on "public"."assistant_activity"
as permissive
for insert
to public
with check ((assistant_id IN ( SELECT assistants.id
   FROM assistants
  WHERE (assistants.user_id = auth.uid()))));


create policy "Users can update their assistant activity"
on "public"."assistant_activity"
as permissive
for update
to public
using ((assistant_id IN ( SELECT assistants.id
   FROM assistants
  WHERE (assistants.user_id = auth.uid()))));


create policy "Users can view their assistant activity"
on "public"."assistant_activity"
as permissive
for select
to public
using ((assistant_id IN ( SELECT assistants.id
   FROM assistants
  WHERE (assistants.user_id = auth.uid()))));


create policy "admin_users_select_all_assistant_configs"
on "public"."assistant_configs"
as permissive
for select
to authenticated
using (is_admin());


create policy "plan_users_delete_own_assistant_configs"
on "public"."assistant_configs"
as permissive
for delete
to authenticated
using (((id IN ( SELECT assistants.id
   FROM assistants
  WHERE (assistants.user_id = auth.uid()))) AND (NOT is_admin())));


create policy "plan_users_insert_own_assistant_configs"
on "public"."assistant_configs"
as permissive
for insert
to authenticated
with check (((id IN ( SELECT assistants.id
   FROM assistants
  WHERE (assistants.user_id = auth.uid()))) AND (NOT is_admin())));


create policy "plan_users_select_own_assistant_configs"
on "public"."assistant_configs"
as permissive
for select
to authenticated
using (((id IN ( SELECT assistants.id
   FROM assistants
  WHERE (assistants.user_id = auth.uid()))) AND (NOT is_admin())));


create policy "plan_users_update_own_assistant_configs"
on "public"."assistant_configs"
as permissive
for update
to authenticated
using (((id IN ( SELECT assistants.id
   FROM assistants
  WHERE (assistants.user_id = auth.uid()))) AND (NOT is_admin())))
with check (((id IN ( SELECT assistants.id
   FROM assistants
  WHERE (assistants.user_id = auth.uid()))) AND (NOT is_admin())));


create policy "admin_users_select_all_assistant_limits"
on "public"."assistant_limits"
as permissive
for select
to authenticated
using (is_admin());


create policy "plan_users_select_own_assistant_limits"
on "public"."assistant_limits"
as permissive
for select
to authenticated
using (((assistant_id IN ( SELECT assistants.id
   FROM assistants
  WHERE (assistants.user_id = auth.uid()))) AND (NOT is_admin())));


create policy "admin_users_select_all_assistant_subscriptions"
on "public"."assistant_subscriptions"
as permissive
for select
to authenticated
using (is_admin());


create policy "plan_users_delete_own_assistant_subscriptions"
on "public"."assistant_subscriptions"
as permissive
for delete
to authenticated
using (((assistant_id IN ( SELECT assistants.id
   FROM assistants
  WHERE (assistants.user_id = auth.uid()))) AND (NOT is_admin())));


create policy "plan_users_insert_own_assistant_subscriptions"
on "public"."assistant_subscriptions"
as permissive
for insert
to authenticated
with check (((assistant_id IN ( SELECT assistants.id
   FROM assistants
  WHERE (assistants.user_id = auth.uid()))) AND (NOT is_admin())));


create policy "plan_users_select_own_assistant_subscriptions"
on "public"."assistant_subscriptions"
as permissive
for select
to authenticated
using (((assistant_id IN ( SELECT assistants.id
   FROM assistants
  WHERE (assistants.user_id = auth.uid()))) AND (NOT is_admin())));


create policy "plan_users_update_own_assistant_subscriptions"
on "public"."assistant_subscriptions"
as permissive
for update
to authenticated
using (((assistant_id IN ( SELECT assistants.id
   FROM assistants
  WHERE (assistants.user_id = auth.uid()))) AND (NOT is_admin())))
with check (((assistant_id IN ( SELECT assistants.id
   FROM assistants
  WHERE (assistants.user_id = auth.uid()))) AND (NOT is_admin())));


create policy "Users can delete their assistant usage limits"
on "public"."assistant_usage_limits"
as permissive
for delete
to public
using ((assistant_id IN ( SELECT assistants.id
   FROM assistants
  WHERE (assistants.user_id = auth.uid()))));


create policy "Users can insert their assistant usage limits"
on "public"."assistant_usage_limits"
as permissive
for insert
to public
with check ((assistant_id IN ( SELECT assistants.id
   FROM assistants
  WHERE (assistants.user_id = auth.uid()))));


create policy "Users can update their assistant usage limits"
on "public"."assistant_usage_limits"
as permissive
for update
to public
using ((assistant_id IN ( SELECT assistants.id
   FROM assistants
  WHERE (assistants.user_id = auth.uid()))));


create policy "Users can view their assistant usage limits"
on "public"."assistant_usage_limits"
as permissive
for select
to public
using ((assistant_id IN ( SELECT assistants.id
   FROM assistants
  WHERE (assistants.user_id = auth.uid()))));


create policy "admin_users_select_all_assistants"
on "public"."assistants"
as permissive
for select
to authenticated
using (is_admin());


create policy "plan_users_delete_own_assistants"
on "public"."assistants"
as permissive
for delete
to authenticated
using (((user_id = auth.uid()) AND (NOT is_admin())));


create policy "plan_users_insert_own_assistants"
on "public"."assistants"
as permissive
for insert
to authenticated
with check (((user_id = auth.uid()) AND (NOT is_admin())));


create policy "plan_users_select_own_assistants"
on "public"."assistants"
as permissive
for select
to authenticated
using (((user_id = auth.uid()) AND (NOT is_admin())));


create policy "plan_users_update_own_assistants"
on "public"."assistants"
as permissive
for update
to authenticated
using (((user_id = auth.uid()) AND (NOT is_admin())))
with check (((user_id = auth.uid()) AND (NOT is_admin())));


create policy "admin_users_select_all_audit_logs"
on "public"."audit_logs"
as permissive
for select
to authenticated
using (is_admin());


create policy "plan_users_insert_own_audit_logs"
on "public"."audit_logs"
as permissive
for insert
to authenticated
with check (((performed_by = auth.uid()) AND (NOT is_admin())));


create policy "plan_users_select_own_audit_logs"
on "public"."audit_logs"
as permissive
for select
to authenticated
using (((performed_by = auth.uid()) AND (NOT is_admin())));


create policy "admin_users_select_all_historical_usage"
on "public"."historical_usage"
as permissive
for select
to authenticated
using (is_admin());


create policy "plan_users_select_own_historical_usage"
on "public"."historical_usage"
as permissive
for select
to authenticated
using (((assistant_id IN ( SELECT assistants.id
   FROM assistants
  WHERE (assistants.user_id = auth.uid()))) AND (NOT is_admin())));


create policy "admin_users_select_all_interactions"
on "public"."interactions"
as permissive
for select
to authenticated
using (is_admin());


create policy "plan_users_select_own_interactions"
on "public"."interactions"
as permissive
for select
to authenticated
using ((((COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid) = auth.uid()) OR (assistant_id IN ( SELECT assistants.id
   FROM assistants
  WHERE (assistants.user_id = auth.uid())))) AND (NOT is_admin())));


create policy "Allow service_role full access on payment_sessions"
on "public"."payment_sessions"
as permissive
for all
to service_role
using (true)
with check (true);


create policy "admin_users_select_all_payment_sessions"
on "public"."payment_sessions"
as permissive
for select
to authenticated
using (is_admin());


create policy "plan_users_insert_own_payment_sessions"
on "public"."payment_sessions"
as permissive
for insert
to authenticated
with check (((user_id = auth.uid()) AND (NOT is_admin())));


create policy "plan_users_select_own_payment_sessions"
on "public"."payment_sessions"
as permissive
for select
to authenticated
using (((user_id = auth.uid()) AND (NOT is_admin())));


create policy "plan_users_update_own_payment_sessions"
on "public"."payment_sessions"
as permissive
for update
to authenticated
using (((user_id = auth.uid()) AND (NOT is_admin())))
with check (((user_id = auth.uid()) AND (NOT is_admin())));


create policy "admin_users_select_all_phone_numbers"
on "public"."phone_numbers"
as permissive
for select
to authenticated
using (is_admin());


create policy "plan_users_select_own_or_unassigned_phone_numbers"
on "public"."phone_numbers"
as permissive
for select
to authenticated
using ((((assistant_id IS NULL) OR (assistant_id IN ( SELECT assistants.id
   FROM assistants
  WHERE (assistants.user_id = auth.uid())))) AND (NOT is_admin())));


create policy "plan_users_update_own_or_unassigned_phone_numbers"
on "public"."phone_numbers"
as permissive
for update
to authenticated
using ((((assistant_id IS NULL) OR (assistant_id IN ( SELECT assistants.id
   FROM assistants
  WHERE (assistants.user_id = auth.uid())))) AND (NOT is_admin())))
with check ((((assistant_id IS NULL) OR (assistant_id IN ( SELECT assistants.id
   FROM assistants
  WHERE (assistants.user_id = auth.uid())))) AND (NOT is_admin())));


create policy "admin_users_select_all_usage_statistics"
on "public"."usage_statistics"
as permissive
for select
to authenticated
using (is_admin());


create policy "plan_users_select_own_usage_statistics"
on "public"."usage_statistics"
as permissive
for select
to authenticated
using (((((entity_type = 'user'::text) AND (entity_id = auth.uid())) OR ((entity_type = 'assistant'::text) AND (entity_id IN ( SELECT assistants.id
   FROM assistants
  WHERE (assistants.user_id = auth.uid()))))) AND (NOT is_admin())));


CREATE TRIGGER trg_check_new_month BEFORE UPDATE ON public.assistant_limits FOR EACH ROW EXECUTE FUNCTION archive_monthly_usage();

CREATE TRIGGER trg_plan_change AFTER UPDATE ON public.assistant_subscriptions FOR EACH ROW EXECUTE FUNCTION log_plan_change();

CREATE TRIGGER trg_subscription_status_change AFTER UPDATE OF status ON public.assistant_subscriptions FOR EACH ROW EXECUTE FUNCTION reset_usage_limits();

CREATE TRIGGER trg_enforce_message_limit BEFORE INSERT ON public.interactions FOR EACH ROW EXECUTE FUNCTION enforce_message_limit();

CREATE TRIGGER update_interactions_updated_at BEFORE UPDATE ON public.interactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_sessions_updated_at BEFORE UPDATE ON public.payment_sessions FOR EACH ROW EXECUTE FUNCTION update_payment_sessions_updated_at();


