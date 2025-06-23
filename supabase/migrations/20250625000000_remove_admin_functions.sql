-- Migration to remove admin-related SQL functions

BEGIN;

DROP FUNCTION IF EXISTS "public"."is_admin"();
DROP FUNCTION IF EXISTS "public"."make_admin"(user_id uuid);
DROP FUNCTION IF EXISTS "public"."remove_admin"(user_email text);
DROP FUNCTION IF EXISTS "public"."remove_admin"(user_id uuid);

COMMIT;
