drop trigger if exists "update_notifications_updated_at" on "public"."notifications";

revoke delete on table "public"."notifications" from "admin";

revoke insert on table "public"."notifications" from "admin";

revoke references on table "public"."notifications" from "admin";

revoke select on table "public"."notifications" from "admin";

revoke trigger on table "public"."notifications" from "admin";

revoke truncate on table "public"."notifications" from "admin";

revoke update on table "public"."notifications" from "admin";

revoke delete on table "public"."notifications" from "anon";

revoke insert on table "public"."notifications" from "anon";

revoke references on table "public"."notifications" from "anon";

revoke select on table "public"."notifications" from "anon";

revoke trigger on table "public"."notifications" from "anon";

revoke truncate on table "public"."notifications" from "anon";

revoke update on table "public"."notifications" from "anon";

revoke delete on table "public"."notifications" from "authenticated";

revoke insert on table "public"."notifications" from "authenticated";

revoke references on table "public"."notifications" from "authenticated";

revoke select on table "public"."notifications" from "authenticated";

revoke trigger on table "public"."notifications" from "authenticated";

revoke truncate on table "public"."notifications" from "authenticated";

revoke update on table "public"."notifications" from "authenticated";

revoke delete on table "public"."notifications" from "service_role";

revoke insert on table "public"."notifications" from "service_role";

revoke references on table "public"."notifications" from "service_role";

revoke select on table "public"."notifications" from "service_role";

revoke trigger on table "public"."notifications" from "service_role";

revoke truncate on table "public"."notifications" from "service_role";

revoke update on table "public"."notifications" from "service_role";

alter table "public"."notifications" drop constraint "notifications_type_check";

alter table "public"."notifications" drop constraint "notifications_user_id_fkey";

alter table "public"."notifications" drop constraint "notifications_pkey";

drop index if exists "public"."notifications_created_at_idx";

drop index if exists "public"."notifications_pkey";

drop index if exists "public"."notifications_user_id_idx";

drop table "public"."notifications";


