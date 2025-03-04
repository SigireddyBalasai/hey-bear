

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





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."assistants" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "assistant_id" "text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "last_used_at" timestamp with time zone,
    "message_count" integer DEFAULT 0,
    "metadata" "jsonb"
);


ALTER TABLE "public"."assistants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "assistant_id" "text" NOT NULL,
    "question" "text" NOT NULL,
    "answer" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb"
);


ALTER TABLE "public"."chat_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."phone_numbers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "phone_number" "text" NOT NULL,
    "twilio_sid" "text" NOT NULL,
    "assigned_to_user_id" "uuid",
    "assigned_at" timestamp with time zone,
    "unassigned_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb"
);


ALTER TABLE "public"."phone_numbers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_plans" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "plan_type" "text" DEFAULT 'Personal'::"text" NOT NULL,
    "plan_cost" numeric DEFAULT 9.99 NOT NULL,
    "renewal_date" "date" NOT NULL,
    "max_sms" integer DEFAULT 200 NOT NULL,
    "sms_received" integer DEFAULT 0,
    "sms_sent" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb"
);


ALTER TABLE "public"."user_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "user_id" "uuid" NOT NULL,
    "is_admin" boolean DEFAULT false
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."assistants"
    ADD CONSTRAINT "assistants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assistants"
    ADD CONSTRAINT "assistants_user_id_assistant_id_key" UNIQUE ("user_id", "assistant_id");



ALTER TABLE ONLY "public"."chat_history"
    ADD CONSTRAINT "chat_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."phone_numbers"
    ADD CONSTRAINT "phone_numbers_phone_number_key" UNIQUE ("phone_number");



ALTER TABLE ONLY "public"."phone_numbers"
    ADD CONSTRAINT "phone_numbers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."phone_numbers"
    ADD CONSTRAINT "phone_numbers_twilio_sid_key" UNIQUE ("twilio_sid");



ALTER TABLE ONLY "public"."user_plans"
    ADD CONSTRAINT "user_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_plans"
    ADD CONSTRAINT "user_plans_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."assistants"
    ADD CONSTRAINT "assistants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."phone_numbers"
    ADD CONSTRAINT "phone_numbers_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_plans"
    ADD CONSTRAINT "user_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Admins can manage phone numbers" ON "public"."phone_numbers" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."is_admin" = true)))));



CREATE POLICY "Enable read access for all users" ON "public"."user_roles" FOR SELECT USING (true);



CREATE POLICY "Enable users to view their own data only" ON "public"."user_roles" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can access their own assistants" ON "public"."assistants" TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can access their own plan" ON "public"."user_plans" TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can assign or release numbers" ON "public"."phone_numbers" FOR UPDATE TO "authenticated" USING (((("assigned_to_user_id" IS NULL) AND ("auth"."uid"() IS NOT NULL)) OR ("assigned_to_user_id" = "auth"."uid"())));



CREATE POLICY "Users can insert their own chat history" ON "public"."chat_history" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read their own chat history" ON "public"."chat_history" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "Users can view available or assigned numbers" ON "public"."phone_numbers" FOR SELECT TO "authenticated" USING ((("assigned_to_user_id" IS NULL) OR ("assigned_to_user_id" = "auth"."uid"())));



ALTER TABLE "public"."assistants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."phone_numbers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



































































































































































































GRANT ALL ON TABLE "public"."assistants" TO "anon";
GRANT ALL ON TABLE "public"."assistants" TO "authenticated";
GRANT ALL ON TABLE "public"."assistants" TO "service_role";



GRANT ALL ON TABLE "public"."chat_history" TO "anon";
GRANT ALL ON TABLE "public"."chat_history" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_history" TO "service_role";



GRANT ALL ON TABLE "public"."phone_numbers" TO "anon";
GRANT ALL ON TABLE "public"."phone_numbers" TO "authenticated";
GRANT ALL ON TABLE "public"."phone_numbers" TO "service_role";



GRANT ALL ON TABLE "public"."user_plans" TO "anon";
GRANT ALL ON TABLE "public"."user_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."user_plans" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



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
