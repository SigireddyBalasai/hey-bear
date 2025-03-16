

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






CREATE OR REPLACE FUNCTION "public"."assign_phone_number"("p_assistant_id" "uuid", "p_phone_number" "text", "p_phone_number_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Update assistant with assigned phone number
  UPDATE public.assistants
  SET assigned_phone_number = p_phone_number
  WHERE id = p_assistant_id;
  
  -- Mark phone number as assigned
  UPDATE public.phonenumbers
  SET is_assigned = true
  WHERE id = p_phone_number_id;
END;
$$;


ALTER FUNCTION "public"."assign_phone_number"("p_assistant_id" "uuid", "p_phone_number" "text", "p_phone_number_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_last_active"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE public.users
  SET last_active = NOW()
  WHERE id = NEW.user_id;
  
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
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "params" "jsonb",
    "assigned_phone_number" "text",
    "plan_id" "uuid",
    "is_starred" boolean DEFAULT false,
    "pinecone_name" "text"
);


ALTER TABLE "public"."assistants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assistantusage" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "assistant_id" "uuid",
    "usage_tier_id" "uuid",
    "interactions_used" integer DEFAULT 0,
    "last_reset_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."assistantusage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "assistant_id" "uuid",
    "interaction_time" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "chat" "text" NOT NULL,
    "request" "text" NOT NULL,
    "response" "text" NOT NULL,
    "duration" bigint,
    "user_id" "uuid",
    "token_usage" integer DEFAULT 0,
    "cost_estimate" numeric(10,4) DEFAULT 0,
    "is_error" boolean DEFAULT false,
    "input_tokens" numeric,
    "output_tokens" numeric
);


ALTER TABLE "public"."interactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."phonenumberpool" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "phone_number_id" "uuid",
    "added_by_admin" "uuid",
    "added_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."phonenumberpool" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."phonenumbers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "number" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "is_assigned" boolean DEFAULT false
);


ALTER TABLE "public"."phonenumbers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plans" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "max_interactions" integer,
    "max_assistants" integer,
    "price" numeric(10,2),
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."usagetiers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "max_requests_per_month" integer,
    "max_phone_numbers" integer,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."usagetiers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "auth_user_id" "uuid",
    "plan_id" "uuid",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "is_admin" boolean DEFAULT false,
    "last_active" timestamp with time zone
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."userusage" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "usage_tier_id" "uuid",
    "interactions_used" integer DEFAULT 0,
    "assistants_used" integer DEFAULT 0,
    "phone_numbers_used" integer DEFAULT 0,
    "last_reset_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "token_usage" integer DEFAULT 0,
    "cost_estimate" numeric(10,4) DEFAULT 0
);


ALTER TABLE "public"."userusage" OWNER TO "postgres";


ALTER TABLE ONLY "public"."assistants"
    ADD CONSTRAINT "assistants_pinecone_name_key" UNIQUE ("pinecone_name");



ALTER TABLE ONLY "public"."assistants"
    ADD CONSTRAINT "assistants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assistantusage"
    ADD CONSTRAINT "assistantusage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interactions"
    ADD CONSTRAINT "interactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."phonenumberpool"
    ADD CONSTRAINT "phonenumberpool_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."phonenumbers"
    ADD CONSTRAINT "phonenumbers_number_key" UNIQUE ("number");



ALTER TABLE ONLY "public"."phonenumbers"
    ADD CONSTRAINT "phonenumbers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."usagetiers"
    ADD CONSTRAINT "usagetiers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."userusage"
    ADD CONSTRAINT "userusage_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_assistant_usage_assistant_id" ON "public"."assistantusage" USING "btree" ("assistant_id");



CREATE INDEX "idx_assistants_user_id" ON "public"."assistants" USING "btree" ("user_id");



CREATE INDEX "idx_interactions_assistant_id" ON "public"."interactions" USING "btree" ("assistant_id");



CREATE INDEX "idx_interactions_time" ON "public"."interactions" USING "btree" ("interaction_time");



CREATE INDEX "idx_interactions_user_time" ON "public"."interactions" USING "btree" ("user_id", "interaction_time");



CREATE INDEX "idx_phone_number_pool_phone_number_id" ON "public"."phonenumberpool" USING "btree" ("phone_number_id");



CREATE INDEX "idx_phone_numbers_number" ON "public"."phonenumbers" USING "btree" ("number");



CREATE INDEX "idx_user_usage_user_id" ON "public"."userusage" USING "btree" ("user_id");



CREATE INDEX "idx_users_auth_user_id" ON "public"."users" USING "btree" ("auth_user_id");



CREATE OR REPLACE TRIGGER "trigger_update_user_last_active" AFTER INSERT ON "public"."interactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_last_active"();



CREATE OR REPLACE TRIGGER "trigger_update_user_usage" AFTER INSERT ON "public"."interactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_usage_stats"();



ALTER TABLE ONLY "public"."assistants"
    ADD CONSTRAINT "assistants_assigned_phone_number_fkey" FOREIGN KEY ("assigned_phone_number") REFERENCES "public"."phonenumbers"("number") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."assistants"
    ADD CONSTRAINT "assistants_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."assistants"
    ADD CONSTRAINT "assistants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assistantusage"
    ADD CONSTRAINT "assistantusage_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "public"."assistants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assistantusage"
    ADD CONSTRAINT "assistantusage_usage_tier_id_fkey" FOREIGN KEY ("usage_tier_id") REFERENCES "public"."usagetiers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."interactions"
    ADD CONSTRAINT "interactions_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "public"."assistants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interactions"
    ADD CONSTRAINT "interactions_user_id_fkey1" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."phonenumberpool"
    ADD CONSTRAINT "phonenumberpool_added_by_admin_fkey" FOREIGN KEY ("added_by_admin") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."phonenumberpool"
    ADD CONSTRAINT "phonenumberpool_phone_number_id_fkey" FOREIGN KEY ("phone_number_id") REFERENCES "public"."phonenumbers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."userusage"
    ADD CONSTRAINT "userusage_usage_tier_id_fkey" FOREIGN KEY ("usage_tier_id") REFERENCES "public"."usagetiers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."userusage"
    ADD CONSTRAINT "userusage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."assign_phone_number"("p_assistant_id" "uuid", "p_phone_number" "text", "p_phone_number_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."assign_phone_number"("p_assistant_id" "uuid", "p_phone_number" "text", "p_phone_number_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_phone_number"("p_assistant_id" "uuid", "p_phone_number" "text", "p_phone_number_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_last_active"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_last_active"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_last_active"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_usage_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_usage_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_usage_stats"() TO "service_role";


















GRANT ALL ON TABLE "public"."assistants" TO "anon";
GRANT ALL ON TABLE "public"."assistants" TO "authenticated";
GRANT ALL ON TABLE "public"."assistants" TO "service_role";



GRANT ALL ON TABLE "public"."assistantusage" TO "anon";
GRANT ALL ON TABLE "public"."assistantusage" TO "authenticated";
GRANT ALL ON TABLE "public"."assistantusage" TO "service_role";



GRANT ALL ON TABLE "public"."interactions" TO "anon";
GRANT ALL ON TABLE "public"."interactions" TO "authenticated";
GRANT ALL ON TABLE "public"."interactions" TO "service_role";



GRANT ALL ON TABLE "public"."phonenumberpool" TO "anon";
GRANT ALL ON TABLE "public"."phonenumberpool" TO "authenticated";
GRANT ALL ON TABLE "public"."phonenumberpool" TO "service_role";



GRANT ALL ON TABLE "public"."phonenumbers" TO "anon";
GRANT ALL ON TABLE "public"."phonenumbers" TO "authenticated";
GRANT ALL ON TABLE "public"."phonenumbers" TO "service_role";



GRANT ALL ON TABLE "public"."plans" TO "anon";
GRANT ALL ON TABLE "public"."plans" TO "authenticated";
GRANT ALL ON TABLE "public"."plans" TO "service_role";



GRANT ALL ON TABLE "public"."usagetiers" TO "anon";
GRANT ALL ON TABLE "public"."usagetiers" TO "authenticated";
GRANT ALL ON TABLE "public"."usagetiers" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."userusage" TO "anon";
GRANT ALL ON TABLE "public"."userusage" TO "authenticated";
GRANT ALL ON TABLE "public"."userusage" TO "service_role";



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
