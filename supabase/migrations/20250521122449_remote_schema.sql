create schema if not exists "analytics";

create table "analytics"."interaction_metrics" (
    "interaction_id" uuid not null,
    "input_tokens" integer default 0,
    "output_tokens" integer default 0,
    "total_tokens" integer default 0,
    "cost_estimate" numeric(10,4) default 0,
    "response_time_ms" integer,
    "ai_model" text,
    "client_info" jsonb,
    "sentiment_score" integer,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "analytics"."interaction_metrics" enable row level security;

create table "analytics"."interactions" (
    "id" uuid not null default uuid_generate_v4(),
    "assistant_id" uuid,
    "user_id" uuid,
    "request" text not null,
    "response" text not null,
    "interaction_time" timestamp with time zone default now(),
    "chat" text,
    "is_error" boolean default false,
    "token_usage" integer default 0,
    "input_tokens" integer default 0,
    "output_tokens" integer default 0,
    "duration" integer default 0,
    "monthly_period" text,
    "cost_estimate" numeric(10,2),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "analytics"."interactions" enable row level security;

create table "analytics"."interactions_p2024_05" (
    "id" uuid not null default gen_random_uuid(),
    "assistant_id" uuid,
    "user_id" uuid,
    "interaction_time" timestamp with time zone not null,
    "request" text not null,
    "response" text not null,
    "token_usage" integer,
    "input_tokens" integer,
    "output_tokens" integer,
    "cost_estimate" numeric,
    "duration" integer,
    "chat" text,
    "monthly_period" text,
    "is_error" boolean,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "analytics"."interactions_p2024_05" enable row level security;

create table "analytics"."interactions_p2024_06" (
    "id" uuid not null default gen_random_uuid(),
    "assistant_id" uuid,
    "user_id" uuid,
    "interaction_time" timestamp with time zone not null,
    "request" text not null,
    "response" text not null,
    "token_usage" integer,
    "input_tokens" integer,
    "output_tokens" integer,
    "cost_estimate" numeric,
    "duration" integer,
    "chat" text,
    "monthly_period" text,
    "is_error" boolean,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "analytics"."interactions_p2024_06" enable row level security;

create table "analytics"."interactions_p2024_07" (
    "id" uuid not null default gen_random_uuid(),
    "assistant_id" uuid,
    "user_id" uuid,
    "interaction_time" timestamp with time zone not null,
    "request" text not null,
    "response" text not null,
    "token_usage" integer,
    "input_tokens" integer,
    "output_tokens" integer,
    "cost_estimate" numeric,
    "duration" integer,
    "chat" text,
    "monthly_period" text,
    "is_error" boolean,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "analytics"."interactions_p2024_07" enable row level security;

create table "analytics"."interactions_p2024_08" (
    "id" uuid not null default gen_random_uuid(),
    "assistant_id" uuid,
    "user_id" uuid,
    "interaction_time" timestamp with time zone not null,
    "request" text not null,
    "response" text not null,
    "token_usage" integer,
    "input_tokens" integer,
    "output_tokens" integer,
    "cost_estimate" numeric,
    "duration" integer,
    "chat" text,
    "monthly_period" text,
    "is_error" boolean,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "analytics"."interactions_p2024_08" enable row level security;

create table "analytics"."interactions_p2024_09" (
    "id" uuid not null default gen_random_uuid(),
    "assistant_id" uuid,
    "user_id" uuid,
    "interaction_time" timestamp with time zone not null,
    "request" text not null,
    "response" text not null,
    "token_usage" integer,
    "input_tokens" integer,
    "output_tokens" integer,
    "cost_estimate" numeric,
    "duration" integer,
    "chat" text,
    "monthly_period" text,
    "is_error" boolean,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "analytics"."interactions_p2024_09" enable row level security;

create table "analytics"."interactions_p2024_10" (
    "id" uuid not null default gen_random_uuid(),
    "assistant_id" uuid,
    "user_id" uuid,
    "interaction_time" timestamp with time zone not null,
    "request" text not null,
    "response" text not null,
    "token_usage" integer,
    "input_tokens" integer,
    "output_tokens" integer,
    "cost_estimate" numeric,
    "duration" integer,
    "chat" text,
    "monthly_period" text,
    "is_error" boolean,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "analytics"."interactions_p2024_10" enable row level security;

create table "analytics"."interactions_p2024_11" (
    "id" uuid not null default gen_random_uuid(),
    "assistant_id" uuid,
    "user_id" uuid,
    "interaction_time" timestamp with time zone not null,
    "request" text not null,
    "response" text not null,
    "token_usage" integer,
    "input_tokens" integer,
    "output_tokens" integer,
    "cost_estimate" numeric,
    "duration" integer,
    "chat" text,
    "monthly_period" text,
    "is_error" boolean,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "analytics"."interactions_p2024_11" enable row level security;

create table "analytics"."interactions_p2024_12" (
    "id" uuid not null default gen_random_uuid(),
    "assistant_id" uuid,
    "user_id" uuid,
    "interaction_time" timestamp with time zone not null,
    "request" text not null,
    "response" text not null,
    "token_usage" integer,
    "input_tokens" integer,
    "output_tokens" integer,
    "cost_estimate" numeric,
    "duration" integer,
    "chat" text,
    "monthly_period" text,
    "is_error" boolean,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "analytics"."interactions_p2024_12" enable row level security;

create table "analytics"."interactions_p2025_01" (
    "id" uuid not null default gen_random_uuid(),
    "assistant_id" uuid,
    "user_id" uuid,
    "interaction_time" timestamp with time zone not null,
    "request" text not null,
    "response" text not null,
    "token_usage" integer,
    "input_tokens" integer,
    "output_tokens" integer,
    "cost_estimate" numeric,
    "duration" integer,
    "chat" text,
    "monthly_period" text,
    "is_error" boolean,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "analytics"."interactions_p2025_01" enable row level security;

create table "analytics"."interactions_p2025_02" (
    "id" uuid not null default gen_random_uuid(),
    "assistant_id" uuid,
    "user_id" uuid,
    "interaction_time" timestamp with time zone not null,
    "request" text not null,
    "response" text not null,
    "token_usage" integer,
    "input_tokens" integer,
    "output_tokens" integer,
    "cost_estimate" numeric,
    "duration" integer,
    "chat" text,
    "monthly_period" text,
    "is_error" boolean,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "analytics"."interactions_p2025_02" enable row level security;

create table "analytics"."interactions_p2025_03" (
    "id" uuid not null default gen_random_uuid(),
    "assistant_id" uuid,
    "user_id" uuid,
    "interaction_time" timestamp with time zone not null,
    "request" text not null,
    "response" text not null,
    "token_usage" integer,
    "input_tokens" integer,
    "output_tokens" integer,
    "cost_estimate" numeric,
    "duration" integer,
    "chat" text,
    "monthly_period" text,
    "is_error" boolean,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "analytics"."interactions_p2025_03" enable row level security;

create table "analytics"."interactions_p2025_04" (
    "id" uuid not null default gen_random_uuid(),
    "assistant_id" uuid,
    "user_id" uuid,
    "interaction_time" timestamp with time zone not null,
    "request" text not null,
    "response" text not null,
    "token_usage" integer,
    "input_tokens" integer,
    "output_tokens" integer,
    "cost_estimate" numeric,
    "duration" integer,
    "chat" text,
    "monthly_period" text,
    "is_error" boolean,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "analytics"."interactions_p2025_04" enable row level security;

create table "analytics"."interactions_p2025_05" (
    "id" uuid not null default gen_random_uuid(),
    "assistant_id" uuid,
    "user_id" uuid,
    "interaction_time" timestamp with time zone not null,
    "request" text not null,
    "response" text not null,
    "token_usage" integer,
    "input_tokens" integer,
    "output_tokens" integer,
    "cost_estimate" numeric,
    "duration" integer,
    "chat" text,
    "monthly_period" text,
    "is_error" boolean,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "analytics"."interactions_p2025_05" enable row level security;

create table "analytics"."interactions_p2025_06" (
    "id" uuid not null default gen_random_uuid(),
    "assistant_id" uuid,
    "user_id" uuid,
    "interaction_time" timestamp with time zone not null,
    "request" text not null,
    "response" text not null,
    "token_usage" integer,
    "input_tokens" integer,
    "output_tokens" integer,
    "cost_estimate" numeric,
    "duration" integer,
    "chat" text,
    "monthly_period" text,
    "is_error" boolean,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "analytics"."interactions_p2025_06" enable row level security;

create table "analytics"."interactions_p2025_07" (
    "id" uuid not null default gen_random_uuid(),
    "assistant_id" uuid,
    "user_id" uuid,
    "interaction_time" timestamp with time zone not null,
    "request" text not null,
    "response" text not null,
    "token_usage" integer,
    "input_tokens" integer,
    "output_tokens" integer,
    "cost_estimate" numeric,
    "duration" integer,
    "chat" text,
    "monthly_period" text,
    "is_error" boolean,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "analytics"."interactions_p2025_07" enable row level security;

create table "analytics"."interactions_p2025_08" (
    "id" uuid not null default gen_random_uuid(),
    "assistant_id" uuid,
    "user_id" uuid,
    "interaction_time" timestamp with time zone not null,
    "request" text not null,
    "response" text not null,
    "token_usage" integer,
    "input_tokens" integer,
    "output_tokens" integer,
    "cost_estimate" numeric,
    "duration" integer,
    "chat" text,
    "monthly_period" text,
    "is_error" boolean,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "analytics"."interactions_p2025_08" enable row level security;

create table "analytics"."interactions_p2025_09" (
    "id" uuid not null default gen_random_uuid(),
    "assistant_id" uuid,
    "user_id" uuid,
    "interaction_time" timestamp with time zone not null,
    "request" text not null,
    "response" text not null,
    "token_usage" integer,
    "input_tokens" integer,
    "output_tokens" integer,
    "cost_estimate" numeric,
    "duration" integer,
    "chat" text,
    "monthly_period" text,
    "is_error" boolean,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "analytics"."interactions_p2025_09" enable row level security;

create table "analytics"."interactions_p2025_10" (
    "id" uuid not null default gen_random_uuid(),
    "assistant_id" uuid,
    "user_id" uuid,
    "interaction_time" timestamp with time zone not null,
    "request" text not null,
    "response" text not null,
    "token_usage" integer,
    "input_tokens" integer,
    "output_tokens" integer,
    "cost_estimate" numeric,
    "duration" integer,
    "chat" text,
    "monthly_period" text,
    "is_error" boolean,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "analytics"."interactions_p2025_10" enable row level security;

create table "analytics"."interactions_p2025_11" (
    "id" uuid not null default gen_random_uuid(),
    "assistant_id" uuid,
    "user_id" uuid,
    "interaction_time" timestamp with time zone not null,
    "request" text not null,
    "response" text not null,
    "token_usage" integer,
    "input_tokens" integer,
    "output_tokens" integer,
    "cost_estimate" numeric,
    "duration" integer,
    "chat" text,
    "monthly_period" text,
    "is_error" boolean,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "analytics"."interactions_p2025_11" enable row level security;

create table "analytics"."interactions_p2025_12" (
    "id" uuid not null default gen_random_uuid(),
    "assistant_id" uuid,
    "user_id" uuid,
    "interaction_time" timestamp with time zone not null,
    "request" text not null,
    "response" text not null,
    "token_usage" integer,
    "input_tokens" integer,
    "output_tokens" integer,
    "cost_estimate" numeric,
    "duration" integer,
    "chat" text,
    "monthly_period" text,
    "is_error" boolean,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "analytics"."interactions_p2025_12" enable row level security;

create table "analytics"."interactions_p2026_01" (
    "id" uuid not null default gen_random_uuid(),
    "assistant_id" uuid,
    "user_id" uuid,
    "interaction_time" timestamp with time zone not null,
    "request" text not null,
    "response" text not null,
    "token_usage" integer,
    "input_tokens" integer,
    "output_tokens" integer,
    "cost_estimate" numeric,
    "duration" integer,
    "chat" text,
    "monthly_period" text,
    "is_error" boolean,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "analytics"."interactions_p2026_01" enable row level security;

create table "analytics"."interactions_p2026_02" (
    "id" uuid not null default gen_random_uuid(),
    "assistant_id" uuid,
    "user_id" uuid,
    "interaction_time" timestamp with time zone not null,
    "request" text not null,
    "response" text not null,
    "token_usage" integer,
    "input_tokens" integer,
    "output_tokens" integer,
    "cost_estimate" numeric,
    "duration" integer,
    "chat" text,
    "monthly_period" text,
    "is_error" boolean,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "analytics"."interactions_p2026_02" enable row level security;

create table "analytics"."interactions_p2026_03" (
    "id" uuid not null default gen_random_uuid(),
    "assistant_id" uuid,
    "user_id" uuid,
    "interaction_time" timestamp with time zone not null,
    "request" text not null,
    "response" text not null,
    "token_usage" integer,
    "input_tokens" integer,
    "output_tokens" integer,
    "cost_estimate" numeric,
    "duration" integer,
    "chat" text,
    "monthly_period" text,
    "is_error" boolean,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "analytics"."interactions_p2026_03" enable row level security;

create table "analytics"."interactions_p2026_04" (
    "id" uuid not null default gen_random_uuid(),
    "assistant_id" uuid,
    "user_id" uuid,
    "interaction_time" timestamp with time zone not null,
    "request" text not null,
    "response" text not null,
    "token_usage" integer,
    "input_tokens" integer,
    "output_tokens" integer,
    "cost_estimate" numeric,
    "duration" integer,
    "chat" text,
    "monthly_period" text,
    "is_error" boolean,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "analytics"."interactions_p2026_04" enable row level security;

create table "analytics"."interactions_p2026_05" (
    "id" uuid not null default gen_random_uuid(),
    "assistant_id" uuid,
    "user_id" uuid,
    "interaction_time" timestamp with time zone not null,
    "request" text not null,
    "response" text not null,
    "token_usage" integer,
    "input_tokens" integer,
    "output_tokens" integer,
    "cost_estimate" numeric,
    "duration" integer,
    "chat" text,
    "monthly_period" text,
    "is_error" boolean,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "analytics"."interactions_p2026_05" enable row level security;

create table "analytics"."interactions_partitioned" (
    "id" uuid not null default gen_random_uuid(),
    "assistant_id" uuid,
    "user_id" uuid,
    "interaction_time" timestamp with time zone not null,
    "request" text not null,
    "response" text not null,
    "token_usage" integer,
    "input_tokens" integer,
    "output_tokens" integer,
    "cost_estimate" numeric,
    "duration" integer,
    "chat" text,
    "monthly_period" text,
    "is_error" boolean,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "analytics"."interactions_partitioned" enable row level security;

create table "analytics"."interactions_shadow" (
    "id" uuid not null default gen_random_uuid(),
    "assistant_id" uuid,
    "user_id" uuid,
    "request" text not null,
    "response" text not null,
    "interaction_time" timestamp with time zone default now(),
    "chat" text,
    "is_error" boolean default false,
    "token_usage" integer default 0,
    "input_tokens" integer default 0,
    "output_tokens" integer default 0,
    "duration" integer default 0,
    "monthly_period" text,
    "cost_estimate" numeric(10,2),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "analytics"."interactions_shadow" enable row level security;

CREATE INDEX idx_analytics_interaction_metrics_cost_estimate ON analytics.interaction_metrics USING btree (cost_estimate);

CREATE INDEX idx_analytics_interaction_metrics_created_at ON analytics.interaction_metrics USING btree (created_at);

CREATE INDEX idx_analytics_interaction_metrics_model ON analytics.interaction_metrics USING btree (ai_model);

CREATE INDEX idx_analytics_interaction_metrics_total_tokens ON analytics.interaction_metrics USING btree (total_tokens);

CREATE INDEX idx_analytics_interactions_assistant_id ON analytics.interactions USING btree (assistant_id);

CREATE INDEX idx_analytics_interactions_interaction_time ON analytics.interactions USING btree (interaction_time DESC);

CREATE INDEX idx_analytics_interactions_monthly_period ON analytics.interactions USING btree (monthly_period);

CREATE INDEX idx_analytics_interactions_p_assistant_id ON analytics.interactions_partitioned USING btree (assistant_id, interaction_time DESC);

CREATE INDEX idx_analytics_interactions_p_time ON analytics.interactions_partitioned USING btree (interaction_time DESC);

CREATE INDEX idx_analytics_interactions_p_token_usage ON analytics.interactions_partitioned USING btree (token_usage);

CREATE INDEX idx_analytics_interactions_p_user_id ON analytics.interactions_partitioned USING btree (user_id, interaction_time DESC);

CREATE INDEX idx_analytics_interactions_user_id ON analytics.interactions USING btree (user_id);

CREATE INDEX idx_interactions_p2024_05_assistant_id ON analytics.interactions_p2024_05 USING btree (assistant_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2024_05_time ON analytics.interactions_p2024_05 USING btree (interaction_time DESC);

CREATE INDEX idx_interactions_p2024_05_user_id ON analytics.interactions_p2024_05 USING btree (user_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2024_06_assistant_id ON analytics.interactions_p2024_06 USING btree (assistant_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2024_06_time ON analytics.interactions_p2024_06 USING btree (interaction_time DESC);

CREATE INDEX idx_interactions_p2024_06_user_id ON analytics.interactions_p2024_06 USING btree (user_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2024_07_assistant_id ON analytics.interactions_p2024_07 USING btree (assistant_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2024_07_time ON analytics.interactions_p2024_07 USING btree (interaction_time DESC);

CREATE INDEX idx_interactions_p2024_07_user_id ON analytics.interactions_p2024_07 USING btree (user_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2024_08_assistant_id ON analytics.interactions_p2024_08 USING btree (assistant_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2024_08_time ON analytics.interactions_p2024_08 USING btree (interaction_time DESC);

CREATE INDEX idx_interactions_p2024_08_user_id ON analytics.interactions_p2024_08 USING btree (user_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2024_09_assistant_id ON analytics.interactions_p2024_09 USING btree (assistant_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2024_09_time ON analytics.interactions_p2024_09 USING btree (interaction_time DESC);

CREATE INDEX idx_interactions_p2024_09_user_id ON analytics.interactions_p2024_09 USING btree (user_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2024_10_assistant_id ON analytics.interactions_p2024_10 USING btree (assistant_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2024_10_time ON analytics.interactions_p2024_10 USING btree (interaction_time DESC);

CREATE INDEX idx_interactions_p2024_10_user_id ON analytics.interactions_p2024_10 USING btree (user_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2024_11_assistant_id ON analytics.interactions_p2024_11 USING btree (assistant_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2024_11_time ON analytics.interactions_p2024_11 USING btree (interaction_time DESC);

CREATE INDEX idx_interactions_p2024_11_user_id ON analytics.interactions_p2024_11 USING btree (user_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2024_12_assistant_id ON analytics.interactions_p2024_12 USING btree (assistant_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2024_12_time ON analytics.interactions_p2024_12 USING btree (interaction_time DESC);

CREATE INDEX idx_interactions_p2024_12_user_id ON analytics.interactions_p2024_12 USING btree (user_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2025_01_assistant_id ON analytics.interactions_p2025_01 USING btree (assistant_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2025_01_time ON analytics.interactions_p2025_01 USING btree (interaction_time DESC);

CREATE INDEX idx_interactions_p2025_01_user_id ON analytics.interactions_p2025_01 USING btree (user_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2025_02_assistant_id ON analytics.interactions_p2025_02 USING btree (assistant_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2025_02_time ON analytics.interactions_p2025_02 USING btree (interaction_time DESC);

CREATE INDEX idx_interactions_p2025_02_user_id ON analytics.interactions_p2025_02 USING btree (user_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2025_03_assistant_id ON analytics.interactions_p2025_03 USING btree (assistant_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2025_03_time ON analytics.interactions_p2025_03 USING btree (interaction_time DESC);

CREATE INDEX idx_interactions_p2025_03_user_id ON analytics.interactions_p2025_03 USING btree (user_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2025_04_assistant_id ON analytics.interactions_p2025_04 USING btree (assistant_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2025_04_time ON analytics.interactions_p2025_04 USING btree (interaction_time DESC);

CREATE INDEX idx_interactions_p2025_04_user_id ON analytics.interactions_p2025_04 USING btree (user_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2025_05_assistant_id ON analytics.interactions_p2025_05 USING btree (assistant_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2025_05_time ON analytics.interactions_p2025_05 USING btree (interaction_time DESC);

CREATE INDEX idx_interactions_p2025_05_user_id ON analytics.interactions_p2025_05 USING btree (user_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2025_06_assistant_id ON analytics.interactions_p2025_06 USING btree (assistant_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2025_06_time ON analytics.interactions_p2025_06 USING btree (interaction_time DESC);

CREATE INDEX idx_interactions_p2025_06_user_id ON analytics.interactions_p2025_06 USING btree (user_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2025_07_assistant_id ON analytics.interactions_p2025_07 USING btree (assistant_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2025_07_time ON analytics.interactions_p2025_07 USING btree (interaction_time DESC);

CREATE INDEX idx_interactions_p2025_07_user_id ON analytics.interactions_p2025_07 USING btree (user_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2025_08_assistant_id ON analytics.interactions_p2025_08 USING btree (assistant_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2025_08_time ON analytics.interactions_p2025_08 USING btree (interaction_time DESC);

CREATE INDEX idx_interactions_p2025_08_user_id ON analytics.interactions_p2025_08 USING btree (user_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2025_09_assistant_id ON analytics.interactions_p2025_09 USING btree (assistant_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2025_09_time ON analytics.interactions_p2025_09 USING btree (interaction_time DESC);

CREATE INDEX idx_interactions_p2025_09_user_id ON analytics.interactions_p2025_09 USING btree (user_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2025_10_assistant_id ON analytics.interactions_p2025_10 USING btree (assistant_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2025_10_time ON analytics.interactions_p2025_10 USING btree (interaction_time DESC);

CREATE INDEX idx_interactions_p2025_10_user_id ON analytics.interactions_p2025_10 USING btree (user_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2025_11_assistant_id ON analytics.interactions_p2025_11 USING btree (assistant_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2025_11_time ON analytics.interactions_p2025_11 USING btree (interaction_time DESC);

CREATE INDEX idx_interactions_p2025_11_user_id ON analytics.interactions_p2025_11 USING btree (user_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2025_12_assistant_id ON analytics.interactions_p2025_12 USING btree (assistant_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2025_12_time ON analytics.interactions_p2025_12 USING btree (interaction_time DESC);

CREATE INDEX idx_interactions_p2025_12_user_id ON analytics.interactions_p2025_12 USING btree (user_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2026_01_assistant_id ON analytics.interactions_p2026_01 USING btree (assistant_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2026_01_time ON analytics.interactions_p2026_01 USING btree (interaction_time DESC);

CREATE INDEX idx_interactions_p2026_01_user_id ON analytics.interactions_p2026_01 USING btree (user_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2026_02_assistant_id ON analytics.interactions_p2026_02 USING btree (assistant_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2026_02_time ON analytics.interactions_p2026_02 USING btree (interaction_time DESC);

CREATE INDEX idx_interactions_p2026_02_user_id ON analytics.interactions_p2026_02 USING btree (user_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2026_03_assistant_id ON analytics.interactions_p2026_03 USING btree (assistant_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2026_03_time ON analytics.interactions_p2026_03 USING btree (interaction_time DESC);

CREATE INDEX idx_interactions_p2026_03_user_id ON analytics.interactions_p2026_03 USING btree (user_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2026_04_assistant_id ON analytics.interactions_p2026_04 USING btree (assistant_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2026_04_time ON analytics.interactions_p2026_04 USING btree (interaction_time DESC);

CREATE INDEX idx_interactions_p2026_04_user_id ON analytics.interactions_p2026_04 USING btree (user_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2026_05_assistant_id ON analytics.interactions_p2026_05 USING btree (assistant_id, interaction_time DESC);

CREATE INDEX idx_interactions_p2026_05_time ON analytics.interactions_p2026_05 USING btree (interaction_time DESC);

CREATE INDEX idx_interactions_p2026_05_user_id ON analytics.interactions_p2026_05 USING btree (user_id, interaction_time DESC);

CREATE UNIQUE INDEX interaction_metrics_pkey ON analytics.interaction_metrics USING btree (interaction_id);

CREATE INDEX interactions_assistant_time_idx ON analytics.interactions USING btree (assistant_id, interaction_time DESC);

CREATE INDEX interactions_cost_analysis_idx ON analytics.interactions USING btree (assistant_id, user_id, monthly_period, cost_estimate);

CREATE INDEX interactions_p2024_05_assistant_id_interaction_time_idx ON analytics.interactions_p2024_05 USING btree (assistant_id, interaction_time DESC);

CREATE UNIQUE INDEX interactions_p2024_05_pkey ON analytics.interactions_p2024_05 USING btree (interaction_time, id);

CREATE INDEX interactions_p2024_05_token_usage_idx ON analytics.interactions_p2024_05 USING btree (token_usage);

CREATE INDEX interactions_p2024_05_user_id_interaction_time_idx ON analytics.interactions_p2024_05 USING btree (user_id, interaction_time DESC);

CREATE INDEX interactions_p2024_06_assistant_id_interaction_time_idx ON analytics.interactions_p2024_06 USING btree (assistant_id, interaction_time DESC);

CREATE UNIQUE INDEX interactions_p2024_06_pkey ON analytics.interactions_p2024_06 USING btree (interaction_time, id);

CREATE INDEX interactions_p2024_06_token_usage_idx ON analytics.interactions_p2024_06 USING btree (token_usage);

CREATE INDEX interactions_p2024_06_user_id_interaction_time_idx ON analytics.interactions_p2024_06 USING btree (user_id, interaction_time DESC);

CREATE INDEX interactions_p2024_07_assistant_id_interaction_time_idx ON analytics.interactions_p2024_07 USING btree (assistant_id, interaction_time DESC);

CREATE UNIQUE INDEX interactions_p2024_07_pkey ON analytics.interactions_p2024_07 USING btree (interaction_time, id);

CREATE INDEX interactions_p2024_07_token_usage_idx ON analytics.interactions_p2024_07 USING btree (token_usage);

CREATE INDEX interactions_p2024_07_user_id_interaction_time_idx ON analytics.interactions_p2024_07 USING btree (user_id, interaction_time DESC);

CREATE INDEX interactions_p2024_08_assistant_id_interaction_time_idx ON analytics.interactions_p2024_08 USING btree (assistant_id, interaction_time DESC);

CREATE UNIQUE INDEX interactions_p2024_08_pkey ON analytics.interactions_p2024_08 USING btree (interaction_time, id);

CREATE INDEX interactions_p2024_08_token_usage_idx ON analytics.interactions_p2024_08 USING btree (token_usage);

CREATE INDEX interactions_p2024_08_user_id_interaction_time_idx ON analytics.interactions_p2024_08 USING btree (user_id, interaction_time DESC);

CREATE INDEX interactions_p2024_09_assistant_id_interaction_time_idx ON analytics.interactions_p2024_09 USING btree (assistant_id, interaction_time DESC);

CREATE UNIQUE INDEX interactions_p2024_09_pkey ON analytics.interactions_p2024_09 USING btree (interaction_time, id);

CREATE INDEX interactions_p2024_09_token_usage_idx ON analytics.interactions_p2024_09 USING btree (token_usage);

CREATE INDEX interactions_p2024_09_user_id_interaction_time_idx ON analytics.interactions_p2024_09 USING btree (user_id, interaction_time DESC);

CREATE INDEX interactions_p2024_10_assistant_id_interaction_time_idx ON analytics.interactions_p2024_10 USING btree (assistant_id, interaction_time DESC);

CREATE UNIQUE INDEX interactions_p2024_10_pkey ON analytics.interactions_p2024_10 USING btree (interaction_time, id);

CREATE INDEX interactions_p2024_10_token_usage_idx ON analytics.interactions_p2024_10 USING btree (token_usage);

CREATE INDEX interactions_p2024_10_user_id_interaction_time_idx ON analytics.interactions_p2024_10 USING btree (user_id, interaction_time DESC);

CREATE INDEX interactions_p2024_11_assistant_id_interaction_time_idx ON analytics.interactions_p2024_11 USING btree (assistant_id, interaction_time DESC);

CREATE UNIQUE INDEX interactions_p2024_11_pkey ON analytics.interactions_p2024_11 USING btree (interaction_time, id);

CREATE INDEX interactions_p2024_11_token_usage_idx ON analytics.interactions_p2024_11 USING btree (token_usage);

CREATE INDEX interactions_p2024_11_user_id_interaction_time_idx ON analytics.interactions_p2024_11 USING btree (user_id, interaction_time DESC);

CREATE INDEX interactions_p2024_12_assistant_id_interaction_time_idx ON analytics.interactions_p2024_12 USING btree (assistant_id, interaction_time DESC);

CREATE UNIQUE INDEX interactions_p2024_12_pkey ON analytics.interactions_p2024_12 USING btree (interaction_time, id);

CREATE INDEX interactions_p2024_12_token_usage_idx ON analytics.interactions_p2024_12 USING btree (token_usage);

CREATE INDEX interactions_p2024_12_user_id_interaction_time_idx ON analytics.interactions_p2024_12 USING btree (user_id, interaction_time DESC);

CREATE INDEX interactions_p2025_01_assistant_id_interaction_time_idx ON analytics.interactions_p2025_01 USING btree (assistant_id, interaction_time DESC);

CREATE UNIQUE INDEX interactions_p2025_01_pkey ON analytics.interactions_p2025_01 USING btree (interaction_time, id);

CREATE INDEX interactions_p2025_01_token_usage_idx ON analytics.interactions_p2025_01 USING btree (token_usage);

CREATE INDEX interactions_p2025_01_user_id_interaction_time_idx ON analytics.interactions_p2025_01 USING btree (user_id, interaction_time DESC);

CREATE INDEX interactions_p2025_02_assistant_id_interaction_time_idx ON analytics.interactions_p2025_02 USING btree (assistant_id, interaction_time DESC);

CREATE UNIQUE INDEX interactions_p2025_02_pkey ON analytics.interactions_p2025_02 USING btree (interaction_time, id);

CREATE INDEX interactions_p2025_02_token_usage_idx ON analytics.interactions_p2025_02 USING btree (token_usage);

CREATE INDEX interactions_p2025_02_user_id_interaction_time_idx ON analytics.interactions_p2025_02 USING btree (user_id, interaction_time DESC);

CREATE INDEX interactions_p2025_03_assistant_id_interaction_time_idx ON analytics.interactions_p2025_03 USING btree (assistant_id, interaction_time DESC);

CREATE UNIQUE INDEX interactions_p2025_03_pkey ON analytics.interactions_p2025_03 USING btree (interaction_time, id);

CREATE INDEX interactions_p2025_03_token_usage_idx ON analytics.interactions_p2025_03 USING btree (token_usage);

CREATE INDEX interactions_p2025_03_user_id_interaction_time_idx ON analytics.interactions_p2025_03 USING btree (user_id, interaction_time DESC);

CREATE INDEX interactions_p2025_04_assistant_id_interaction_time_idx ON analytics.interactions_p2025_04 USING btree (assistant_id, interaction_time DESC);

CREATE UNIQUE INDEX interactions_p2025_04_pkey ON analytics.interactions_p2025_04 USING btree (interaction_time, id);

CREATE INDEX interactions_p2025_04_token_usage_idx ON analytics.interactions_p2025_04 USING btree (token_usage);

CREATE INDEX interactions_p2025_04_user_id_interaction_time_idx ON analytics.interactions_p2025_04 USING btree (user_id, interaction_time DESC);

CREATE INDEX interactions_p2025_05_assistant_id_interaction_time_idx ON analytics.interactions_p2025_05 USING btree (assistant_id, interaction_time DESC);

CREATE UNIQUE INDEX interactions_p2025_05_pkey ON analytics.interactions_p2025_05 USING btree (interaction_time, id);

CREATE INDEX interactions_p2025_05_token_usage_idx ON analytics.interactions_p2025_05 USING btree (token_usage);

CREATE INDEX interactions_p2025_05_user_id_interaction_time_idx ON analytics.interactions_p2025_05 USING btree (user_id, interaction_time DESC);

CREATE INDEX interactions_p2025_06_assistant_id_interaction_time_idx ON analytics.interactions_p2025_06 USING btree (assistant_id, interaction_time DESC);

CREATE UNIQUE INDEX interactions_p2025_06_pkey ON analytics.interactions_p2025_06 USING btree (interaction_time, id);

CREATE INDEX interactions_p2025_06_token_usage_idx ON analytics.interactions_p2025_06 USING btree (token_usage);

CREATE INDEX interactions_p2025_06_user_id_interaction_time_idx ON analytics.interactions_p2025_06 USING btree (user_id, interaction_time DESC);

CREATE INDEX interactions_p2025_07_assistant_id_interaction_time_idx ON analytics.interactions_p2025_07 USING btree (assistant_id, interaction_time DESC);

CREATE UNIQUE INDEX interactions_p2025_07_pkey ON analytics.interactions_p2025_07 USING btree (interaction_time, id);

CREATE INDEX interactions_p2025_07_token_usage_idx ON analytics.interactions_p2025_07 USING btree (token_usage);

CREATE INDEX interactions_p2025_07_user_id_interaction_time_idx ON analytics.interactions_p2025_07 USING btree (user_id, interaction_time DESC);

CREATE INDEX interactions_p2025_08_assistant_id_interaction_time_idx ON analytics.interactions_p2025_08 USING btree (assistant_id, interaction_time DESC);

CREATE UNIQUE INDEX interactions_p2025_08_pkey ON analytics.interactions_p2025_08 USING btree (interaction_time, id);

CREATE INDEX interactions_p2025_08_token_usage_idx ON analytics.interactions_p2025_08 USING btree (token_usage);

CREATE INDEX interactions_p2025_08_user_id_interaction_time_idx ON analytics.interactions_p2025_08 USING btree (user_id, interaction_time DESC);

CREATE INDEX interactions_p2025_09_assistant_id_interaction_time_idx ON analytics.interactions_p2025_09 USING btree (assistant_id, interaction_time DESC);

CREATE UNIQUE INDEX interactions_p2025_09_pkey ON analytics.interactions_p2025_09 USING btree (interaction_time, id);

CREATE INDEX interactions_p2025_09_token_usage_idx ON analytics.interactions_p2025_09 USING btree (token_usage);

CREATE INDEX interactions_p2025_09_user_id_interaction_time_idx ON analytics.interactions_p2025_09 USING btree (user_id, interaction_time DESC);

CREATE INDEX interactions_p2025_10_assistant_id_interaction_time_idx ON analytics.interactions_p2025_10 USING btree (assistant_id, interaction_time DESC);

CREATE UNIQUE INDEX interactions_p2025_10_pkey ON analytics.interactions_p2025_10 USING btree (interaction_time, id);

CREATE INDEX interactions_p2025_10_token_usage_idx ON analytics.interactions_p2025_10 USING btree (token_usage);

CREATE INDEX interactions_p2025_10_user_id_interaction_time_idx ON analytics.interactions_p2025_10 USING btree (user_id, interaction_time DESC);

CREATE INDEX interactions_p2025_11_assistant_id_interaction_time_idx ON analytics.interactions_p2025_11 USING btree (assistant_id, interaction_time DESC);

CREATE UNIQUE INDEX interactions_p2025_11_pkey ON analytics.interactions_p2025_11 USING btree (interaction_time, id);

CREATE INDEX interactions_p2025_11_token_usage_idx ON analytics.interactions_p2025_11 USING btree (token_usage);

CREATE INDEX interactions_p2025_11_user_id_interaction_time_idx ON analytics.interactions_p2025_11 USING btree (user_id, interaction_time DESC);

CREATE INDEX interactions_p2025_12_assistant_id_interaction_time_idx ON analytics.interactions_p2025_12 USING btree (assistant_id, interaction_time DESC);

CREATE UNIQUE INDEX interactions_p2025_12_pkey ON analytics.interactions_p2025_12 USING btree (interaction_time, id);

CREATE INDEX interactions_p2025_12_token_usage_idx ON analytics.interactions_p2025_12 USING btree (token_usage);

CREATE INDEX interactions_p2025_12_user_id_interaction_time_idx ON analytics.interactions_p2025_12 USING btree (user_id, interaction_time DESC);

CREATE INDEX interactions_p2026_01_assistant_id_interaction_time_idx ON analytics.interactions_p2026_01 USING btree (assistant_id, interaction_time DESC);

CREATE UNIQUE INDEX interactions_p2026_01_pkey ON analytics.interactions_p2026_01 USING btree (interaction_time, id);

CREATE INDEX interactions_p2026_01_token_usage_idx ON analytics.interactions_p2026_01 USING btree (token_usage);

CREATE INDEX interactions_p2026_01_user_id_interaction_time_idx ON analytics.interactions_p2026_01 USING btree (user_id, interaction_time DESC);

CREATE INDEX interactions_p2026_02_assistant_id_interaction_time_idx ON analytics.interactions_p2026_02 USING btree (assistant_id, interaction_time DESC);

CREATE UNIQUE INDEX interactions_p2026_02_pkey ON analytics.interactions_p2026_02 USING btree (interaction_time, id);

CREATE INDEX interactions_p2026_02_token_usage_idx ON analytics.interactions_p2026_02 USING btree (token_usage);

CREATE INDEX interactions_p2026_02_user_id_interaction_time_idx ON analytics.interactions_p2026_02 USING btree (user_id, interaction_time DESC);

CREATE INDEX interactions_p2026_03_assistant_id_interaction_time_idx ON analytics.interactions_p2026_03 USING btree (assistant_id, interaction_time DESC);

CREATE UNIQUE INDEX interactions_p2026_03_pkey ON analytics.interactions_p2026_03 USING btree (interaction_time, id);

CREATE INDEX interactions_p2026_03_token_usage_idx ON analytics.interactions_p2026_03 USING btree (token_usage);

CREATE INDEX interactions_p2026_03_user_id_interaction_time_idx ON analytics.interactions_p2026_03 USING btree (user_id, interaction_time DESC);

CREATE INDEX interactions_p2026_04_assistant_id_interaction_time_idx ON analytics.interactions_p2026_04 USING btree (assistant_id, interaction_time DESC);

CREATE UNIQUE INDEX interactions_p2026_04_pkey ON analytics.interactions_p2026_04 USING btree (interaction_time, id);

CREATE INDEX interactions_p2026_04_token_usage_idx ON analytics.interactions_p2026_04 USING btree (token_usage);

CREATE INDEX interactions_p2026_04_user_id_interaction_time_idx ON analytics.interactions_p2026_04 USING btree (user_id, interaction_time DESC);

CREATE INDEX interactions_p2026_05_assistant_id_interaction_time_idx ON analytics.interactions_p2026_05 USING btree (assistant_id, interaction_time DESC);

CREATE UNIQUE INDEX interactions_p2026_05_pkey ON analytics.interactions_p2026_05 USING btree (interaction_time, id);

CREATE INDEX interactions_p2026_05_token_usage_idx ON analytics.interactions_p2026_05 USING btree (token_usage);

CREATE INDEX interactions_p2026_05_user_id_interaction_time_idx ON analytics.interactions_p2026_05 USING btree (user_id, interaction_time DESC);

CREATE UNIQUE INDEX interactions_partitioned_pkey ON analytics.interactions_partitioned USING btree (id);

CREATE UNIQUE INDEX interactions_pkey ON analytics.interactions USING btree (id);

CREATE INDEX interactions_tokens_idx ON analytics.interactions USING btree (token_usage, input_tokens, output_tokens);

CREATE INDEX interactions_user_time_idx ON analytics.interactions USING btree (user_id, interaction_time DESC);

alter table "analytics"."interaction_metrics" add constraint "interaction_metrics_pkey" PRIMARY KEY using index "interaction_metrics_pkey";

alter table "analytics"."interactions" add constraint "interactions_pkey" PRIMARY KEY using index "interactions_pkey";

alter table "analytics"."interactions_p2024_05" add constraint "interactions_p2024_05_pkey" PRIMARY KEY using index "interactions_p2024_05_pkey";

alter table "analytics"."interactions_p2024_06" add constraint "interactions_p2024_06_pkey" PRIMARY KEY using index "interactions_p2024_06_pkey";

alter table "analytics"."interactions_p2024_07" add constraint "interactions_p2024_07_pkey" PRIMARY KEY using index "interactions_p2024_07_pkey";

alter table "analytics"."interactions_p2024_08" add constraint "interactions_p2024_08_pkey" PRIMARY KEY using index "interactions_p2024_08_pkey";

alter table "analytics"."interactions_p2024_09" add constraint "interactions_p2024_09_pkey" PRIMARY KEY using index "interactions_p2024_09_pkey";

alter table "analytics"."interactions_p2024_10" add constraint "interactions_p2024_10_pkey" PRIMARY KEY using index "interactions_p2024_10_pkey";

alter table "analytics"."interactions_p2024_11" add constraint "interactions_p2024_11_pkey" PRIMARY KEY using index "interactions_p2024_11_pkey";

alter table "analytics"."interactions_p2024_12" add constraint "interactions_p2024_12_pkey" PRIMARY KEY using index "interactions_p2024_12_pkey";

alter table "analytics"."interactions_p2025_01" add constraint "interactions_p2025_01_pkey" PRIMARY KEY using index "interactions_p2025_01_pkey";

alter table "analytics"."interactions_p2025_02" add constraint "interactions_p2025_02_pkey" PRIMARY KEY using index "interactions_p2025_02_pkey";

alter table "analytics"."interactions_p2025_03" add constraint "interactions_p2025_03_pkey" PRIMARY KEY using index "interactions_p2025_03_pkey";

alter table "analytics"."interactions_p2025_04" add constraint "interactions_p2025_04_pkey" PRIMARY KEY using index "interactions_p2025_04_pkey";

alter table "analytics"."interactions_p2025_05" add constraint "interactions_p2025_05_pkey" PRIMARY KEY using index "interactions_p2025_05_pkey";

alter table "analytics"."interactions_p2025_06" add constraint "interactions_p2025_06_pkey" PRIMARY KEY using index "interactions_p2025_06_pkey";

alter table "analytics"."interactions_p2025_07" add constraint "interactions_p2025_07_pkey" PRIMARY KEY using index "interactions_p2025_07_pkey";

alter table "analytics"."interactions_p2025_08" add constraint "interactions_p2025_08_pkey" PRIMARY KEY using index "interactions_p2025_08_pkey";

alter table "analytics"."interactions_p2025_09" add constraint "interactions_p2025_09_pkey" PRIMARY KEY using index "interactions_p2025_09_pkey";

alter table "analytics"."interactions_p2025_10" add constraint "interactions_p2025_10_pkey" PRIMARY KEY using index "interactions_p2025_10_pkey";

alter table "analytics"."interactions_p2025_11" add constraint "interactions_p2025_11_pkey" PRIMARY KEY using index "interactions_p2025_11_pkey";

alter table "analytics"."interactions_p2025_12" add constraint "interactions_p2025_12_pkey" PRIMARY KEY using index "interactions_p2025_12_pkey";

alter table "analytics"."interactions_p2026_01" add constraint "interactions_p2026_01_pkey" PRIMARY KEY using index "interactions_p2026_01_pkey";

alter table "analytics"."interactions_p2026_02" add constraint "interactions_p2026_02_pkey" PRIMARY KEY using index "interactions_p2026_02_pkey";

alter table "analytics"."interactions_p2026_03" add constraint "interactions_p2026_03_pkey" PRIMARY KEY using index "interactions_p2026_03_pkey";

alter table "analytics"."interactions_p2026_04" add constraint "interactions_p2026_04_pkey" PRIMARY KEY using index "interactions_p2026_04_pkey";

alter table "analytics"."interactions_p2026_05" add constraint "interactions_p2026_05_pkey" PRIMARY KEY using index "interactions_p2026_05_pkey";

alter table "analytics"."interactions_partitioned" add constraint "interactions_partitioned_pkey" PRIMARY KEY using index "interactions_partitioned_pkey";

alter table "analytics"."interaction_metrics" add constraint "interaction_metrics_interaction_id_fkey" FOREIGN KEY (interaction_id) REFERENCES analytics.interactions(id) ON DELETE CASCADE not valid;

alter table "analytics"."interaction_metrics" validate constraint "interaction_metrics_interaction_id_fkey";

alter table "analytics"."interactions" add constraint "analytics_interactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users.users(id) not valid;

alter table "analytics"."interactions" validate constraint "analytics_interactions_user_id_fkey";

alter table "analytics"."interactions_p2024_05" add constraint "interactions_p2024_05_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users.users(id) NOT VALID not valid;

alter table "analytics"."interactions_p2024_05" validate constraint "interactions_p2024_05_user_id_fkey";

alter table "analytics"."interactions_p2024_06" add constraint "interactions_p2024_06_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users.users(id) NOT VALID not valid;

alter table "analytics"."interactions_p2024_06" validate constraint "interactions_p2024_06_user_id_fkey";

alter table "analytics"."interactions_p2024_07" add constraint "interactions_p2024_07_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users.users(id) NOT VALID not valid;

alter table "analytics"."interactions_p2024_07" validate constraint "interactions_p2024_07_user_id_fkey";

alter table "analytics"."interactions_p2024_08" add constraint "interactions_p2024_08_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users.users(id) NOT VALID not valid;

alter table "analytics"."interactions_p2024_08" validate constraint "interactions_p2024_08_user_id_fkey";

alter table "analytics"."interactions_p2024_09" add constraint "interactions_p2024_09_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users.users(id) NOT VALID not valid;

alter table "analytics"."interactions_p2024_09" validate constraint "interactions_p2024_09_user_id_fkey";

alter table "analytics"."interactions_p2024_10" add constraint "interactions_p2024_10_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users.users(id) NOT VALID not valid;

alter table "analytics"."interactions_p2024_10" validate constraint "interactions_p2024_10_user_id_fkey";

alter table "analytics"."interactions_p2024_11" add constraint "interactions_p2024_11_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users.users(id) NOT VALID not valid;

alter table "analytics"."interactions_p2024_11" validate constraint "interactions_p2024_11_user_id_fkey";

alter table "analytics"."interactions_p2024_12" add constraint "interactions_p2024_12_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users.users(id) NOT VALID not valid;

alter table "analytics"."interactions_p2024_12" validate constraint "interactions_p2024_12_user_id_fkey";

alter table "analytics"."interactions_p2025_01" add constraint "interactions_p2025_01_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users.users(id) NOT VALID not valid;

alter table "analytics"."interactions_p2025_01" validate constraint "interactions_p2025_01_user_id_fkey";

alter table "analytics"."interactions_p2025_02" add constraint "interactions_p2025_02_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users.users(id) NOT VALID not valid;

alter table "analytics"."interactions_p2025_02" validate constraint "interactions_p2025_02_user_id_fkey";

alter table "analytics"."interactions_p2025_03" add constraint "interactions_p2025_03_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users.users(id) NOT VALID not valid;

alter table "analytics"."interactions_p2025_03" validate constraint "interactions_p2025_03_user_id_fkey";

alter table "analytics"."interactions_p2025_04" add constraint "interactions_p2025_04_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users.users(id) NOT VALID not valid;

alter table "analytics"."interactions_p2025_04" validate constraint "interactions_p2025_04_user_id_fkey";

alter table "analytics"."interactions_p2025_05" add constraint "interactions_p2025_05_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users.users(id) NOT VALID not valid;

alter table "analytics"."interactions_p2025_05" validate constraint "interactions_p2025_05_user_id_fkey";

alter table "analytics"."interactions_p2025_06" add constraint "interactions_p2025_06_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users.users(id) NOT VALID not valid;

alter table "analytics"."interactions_p2025_06" validate constraint "interactions_p2025_06_user_id_fkey";

alter table "analytics"."interactions_p2025_07" add constraint "interactions_p2025_07_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users.users(id) NOT VALID not valid;

alter table "analytics"."interactions_p2025_07" validate constraint "interactions_p2025_07_user_id_fkey";

alter table "analytics"."interactions_p2025_08" add constraint "interactions_p2025_08_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users.users(id) NOT VALID not valid;

alter table "analytics"."interactions_p2025_08" validate constraint "interactions_p2025_08_user_id_fkey";

alter table "analytics"."interactions_p2025_09" add constraint "interactions_p2025_09_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users.users(id) NOT VALID not valid;

alter table "analytics"."interactions_p2025_09" validate constraint "interactions_p2025_09_user_id_fkey";

alter table "analytics"."interactions_p2025_10" add constraint "interactions_p2025_10_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users.users(id) NOT VALID not valid;

alter table "analytics"."interactions_p2025_10" validate constraint "interactions_p2025_10_user_id_fkey";

alter table "analytics"."interactions_p2025_11" add constraint "interactions_p2025_11_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users.users(id) NOT VALID not valid;

alter table "analytics"."interactions_p2025_11" validate constraint "interactions_p2025_11_user_id_fkey";

alter table "analytics"."interactions_p2025_12" add constraint "interactions_p2025_12_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users.users(id) NOT VALID not valid;

alter table "analytics"."interactions_p2025_12" validate constraint "interactions_p2025_12_user_id_fkey";

alter table "analytics"."interactions_p2026_01" add constraint "interactions_p2026_01_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users.users(id) NOT VALID not valid;

alter table "analytics"."interactions_p2026_01" validate constraint "interactions_p2026_01_user_id_fkey";

alter table "analytics"."interactions_p2026_02" add constraint "interactions_p2026_02_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users.users(id) NOT VALID not valid;

alter table "analytics"."interactions_p2026_02" validate constraint "interactions_p2026_02_user_id_fkey";

alter table "analytics"."interactions_p2026_03" add constraint "interactions_p2026_03_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users.users(id) NOT VALID not valid;

alter table "analytics"."interactions_p2026_03" validate constraint "interactions_p2026_03_user_id_fkey";

alter table "analytics"."interactions_p2026_04" add constraint "interactions_p2026_04_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users.users(id) NOT VALID not valid;

alter table "analytics"."interactions_p2026_04" validate constraint "interactions_p2026_04_user_id_fkey";

alter table "analytics"."interactions_p2026_05" add constraint "interactions_p2026_05_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users.users(id) NOT VALID not valid;

alter table "analytics"."interactions_p2026_05" validate constraint "interactions_p2026_05_user_id_fkey";

alter table "analytics"."interactions_partitioned" add constraint "interactions_partitioned_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users.users(id) not valid;

alter table "analytics"."interactions_partitioned" validate constraint "interactions_partitioned_user_id_fkey";

set check_function_bodies = off;

create or replace view "analytics"."all_interactions" as  SELECT interactions.id,
    interactions.assistant_id,
    interactions.user_id,
    interactions.interaction_time,
    interactions.request,
    interactions.response,
    interactions.token_usage,
    interactions.input_tokens,
    interactions.output_tokens,
    interactions.cost_estimate,
    interactions.duration,
    interactions.chat,
    interactions.monthly_period,
    interactions.is_error,
    interactions.created_at,
    interactions.updated_at
   FROM analytics.interactions
UNION ALL
 SELECT interactions_partitioned.id,
    interactions_partitioned.assistant_id,
    interactions_partitioned.user_id,
    interactions_partitioned.interaction_time,
    interactions_partitioned.request,
    interactions_partitioned.response,
    interactions_partitioned.token_usage,
    interactions_partitioned.input_tokens,
    interactions_partitioned.output_tokens,
    interactions_partitioned.cost_estimate,
    interactions_partitioned.duration,
    interactions_partitioned.chat,
    interactions_partitioned.monthly_period,
    interactions_partitioned.is_error,
    interactions_partitioned.created_at,
    interactions_partitioned.updated_at
   FROM analytics.interactions_partitioned
UNION ALL
 SELECT interactions_shadow.id,
    interactions_shadow.assistant_id,
    interactions_shadow.user_id,
    interactions_shadow.interaction_time,
    interactions_shadow.request,
    interactions_shadow.response,
    interactions_shadow.token_usage,
    interactions_shadow.input_tokens,
    interactions_shadow.output_tokens,
    interactions_shadow.cost_estimate,
    interactions_shadow.duration,
    interactions_shadow.chat,
    interactions_shadow.monthly_period,
    interactions_shadow.is_error,
    interactions_shadow.created_at,
    interactions_shadow.updated_at
   FROM analytics.interactions_shadow;


CREATE OR REPLACE FUNCTION analytics.apply_partition_policies()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  partition_table text;
  table_exists boolean;
BEGIN
  -- Apply policy to each table individually with explicit table names
  -- Instead of dynamic SQL that might fail if a pattern doesn't match
  
  -- First check if interactions_partitioned exists and apply policies
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
    USING (auth.is_admin());
    
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
  
  -- Process each monthly partition individually with explicit checking
  -- 2024 partitions
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
           ' AS PERMISSIVE FOR ALL TO authenticated USING (auth.is_admin())';
    
    EXECUTE 'CREATE POLICY "' || partition_table || '_assistant_owner_policy" ON analytics.' || partition_table || 
           ' AS PERMISSIVE FOR SELECT TO authenticated USING (auth.owns_assistant(assistant_id))';
    
    EXECUTE 'CREATE POLICY "' || partition_table || '_user_own_data_policy" ON analytics.' || partition_table || 
           ' AS PERMISSIVE FOR SELECT TO authenticated USING (user_id = auth.uid())';
  END LOOP;
  
  -- 2025 partitions
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
           ' AS PERMISSIVE FOR ALL TO authenticated USING (auth.is_admin())';
    
    EXECUTE 'CREATE POLICY "' || partition_table || '_assistant_owner_policy" ON analytics.' || partition_table || 
           ' AS PERMISSIVE FOR SELECT TO authenticated USING (auth.owns_assistant(assistant_id))';
    
    EXECUTE 'CREATE POLICY "' || partition_table || '_user_own_data_policy" ON analytics.' || partition_table || 
           ' AS PERMISSIVE FOR SELECT TO authenticated USING (user_id = auth.uid())';
  END LOOP;
  
  -- 2026 partitions
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
           ' AS PERMISSIVE FOR ALL TO authenticated USING (auth.is_admin())';
    
    EXECUTE 'CREATE POLICY "' || partition_table || '_assistant_owner_policy" ON analytics.' || partition_table || 
           ' AS PERMISSIVE FOR SELECT TO authenticated USING (auth.owns_assistant(assistant_id))';
    
    EXECUTE 'CREATE POLICY "' || partition_table || '_user_own_data_policy" ON analytics.' || partition_table || 
           ' AS PERMISSIVE FOR SELECT TO authenticated USING (user_id = auth.uid())';
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION analytics.ensure_partition_exists(year_month text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    partition_name text;
    partition_exists boolean;
    start_date timestamp with time zone;
    end_date timestamp with time zone;
BEGIN
    partition_name := 'interactions_p' || year_month;
    
    -- Check if partition exists
    SELECT EXISTS (
        SELECT 1
        FROM pg_tables
        WHERE schemaname = 'analytics'
        AND tablename = partition_name
    ) INTO partition_exists;
    
    -- If partition doesn't exist, create it
    IF NOT partition_exists THEN
        -- Calculate date range for partition
        start_date := to_timestamp(year_month || '_01', 'YYYY_MM_DD');
        end_date := start_date + interval '1 month';
        
        -- Create the partition table
        EXECUTE format('
            CREATE TABLE analytics.%I (
                LIKE analytics.interactions_partitioned INCLUDING ALL,
                CONSTRAINT %I_pkey PRIMARY KEY (interaction_time, id),
                CONSTRAINT %I_interaction_time_check 
                    CHECK (interaction_time >= %L AND interaction_time < %L)
            )', 
            partition_name, partition_name, partition_name, start_date, end_date
        );
        
        -- Add indexes similar to existing partitions
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
        
        -- Apply RLS policies (similar to what we defined in previous migration)
        EXECUTE format('
            ALTER TABLE analytics.%I ENABLE ROW LEVEL SECURITY
        ', partition_name);
        
        -- Service role policy
        EXECUTE format('
            CREATE POLICY "%I_service_role_policy" ON analytics.%I
            AS PERMISSIVE FOR ALL TO service_role USING (true)
        ', partition_name, partition_name);
        
        -- Admin policy
        EXECUTE format('
            CREATE POLICY "%I_admin_policy" ON analytics.%I
            AS PERMISSIVE FOR ALL TO authenticated USING (auth.is_admin())
        ', partition_name, partition_name);
        
        -- Assistant owner policy
        EXECUTE format('
            CREATE POLICY "%I_assistant_owner_policy" ON analytics.%I
            AS PERMISSIVE FOR SELECT TO authenticated USING (auth.owns_assistant(assistant_id))
        ', partition_name, partition_name);
        
        -- User own data policy
        EXECUTE format('
            CREATE POLICY "%I_user_own_data_policy" ON analytics.%I
            AS PERMISSIVE FOR SELECT TO authenticated USING (user_id = auth.uid())
        ', partition_name, partition_name);
        
        -- Add foreign key constraint for user_id (same as existing partitions)
        EXECUTE format('
            ALTER TABLE analytics.%I 
            ADD CONSTRAINT %I_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users.users(id) NOT VALID
        ', partition_name, partition_name);
        
        EXECUTE format('
            ALTER TABLE analytics.%I 
            VALIDATE CONSTRAINT %I_user_id_fkey
        ', partition_name, partition_name);
        
        -- Grant proper permissions
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
$function$
;

CREATE OR REPLACE FUNCTION analytics.get_daily_activity_summary()
 RETURNS SETOF analytics.mv_daily_activity_summary
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Only allow admins or service roles to access this function
  IF auth.is_admin() OR (SELECT is_service_role() FROM auth.is_service_role()) THEN
    RETURN QUERY SELECT * FROM analytics.mv_daily_activity_summary;
  ELSE
    RAISE EXCEPTION 'Permission denied: Only admins can access daily activity summary';
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION analytics.get_user_activity_timeline(user_id_filter uuid DEFAULT NULL::uuid)
 RETURNS SETOF analytics.mv_user_activity_timeline
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- If admin or service role, can access any user's data or all data
  IF auth.is_admin() OR (SELECT is_service_role() FROM auth.is_service_role()) THEN
    IF user_id_filter IS NULL THEN
      RETURN QUERY SELECT * FROM analytics.mv_user_activity_timeline;
    ELSE
      RETURN QUERY SELECT * FROM analytics.mv_user_activity_timeline WHERE user_id = user_id_filter;
    END IF;
  ELSE
    -- Regular users can only access their own data
    RETURN QUERY SELECT * FROM analytics.mv_user_activity_timeline WHERE user_id = current_user_id;
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION analytics.insert_interaction(p_assistant_id uuid, p_user_id uuid, p_request text, p_response text, p_interaction_time timestamp with time zone DEFAULT now(), p_chat text DEFAULT NULL::text, p_is_error boolean DEFAULT false, p_token_usage integer DEFAULT 0, p_input_tokens integer DEFAULT 0, p_output_tokens integer DEFAULT 0, p_duration integer DEFAULT 0, p_cost_estimate numeric DEFAULT NULL::numeric)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION analytics.insert_interaction_metrics(p_interaction_id uuid, p_input_tokens integer DEFAULT 0, p_output_tokens integer DEFAULT 0, p_cost_estimate numeric DEFAULT 0, p_response_time_ms integer DEFAULT NULL::integer, p_ai_model text DEFAULT NULL::text, p_client_info jsonb DEFAULT NULL::jsonb, p_sentiment_score integer DEFAULT NULL::integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    INSERT INTO analytics.interaction_metrics (
        interaction_id, input_tokens, output_tokens, total_tokens,
        cost_estimate, response_time_ms, ai_model, client_info, sentiment_score
    ) VALUES (
        p_interaction_id, p_input_tokens, p_output_tokens, (p_input_tokens + p_output_tokens),
        p_cost_estimate, p_response_time_ms, p_ai_model, p_client_info, p_sentiment_score
    );
END;
$function$
;

create materialized view "analytics"."mv_daily_activity_summary" as  SELECT date_trunc('day'::text, (interactions.interaction_time)::timestamp without time zone) AS day,
    count(*) AS total_interactions,
    count(DISTINCT interactions.user_id) AS unique_users,
    count(DISTINCT interactions.assistant_id) AS unique_assistants,
    sum(interactions.token_usage) AS total_tokens,
    sum(interactions.input_tokens) AS total_input_tokens,
    sum(interactions.output_tokens) AS total_output_tokens,
    sum(
        CASE
            WHEN (interactions.is_error = true) THEN 1
            ELSE 0
        END) AS error_count,
    round(avg(interactions.duration)) AS avg_duration_ms,
    sum(interactions.cost_estimate) AS total_cost
   FROM analytics.interactions
  GROUP BY (date_trunc('day'::text, (interactions.interaction_time)::timestamp without time zone))
  ORDER BY (date_trunc('day'::text, (interactions.interaction_time)::timestamp without time zone)) DESC;


create materialized view "analytics"."mv_user_activity_timeline" as  SELECT date_trunc('day'::text, (interactions.interaction_time)::timestamp without time zone) AS day,
    interactions.user_id,
    count(*) AS interaction_count,
    sum(interactions.token_usage) AS total_tokens,
    sum(interactions.input_tokens) AS total_input_tokens,
    sum(interactions.output_tokens) AS total_output_tokens,
    sum(
        CASE
            WHEN (interactions.is_error = true) THEN 1
            ELSE 0
        END) AS error_count,
    sum(interactions.cost_estimate) AS total_cost
   FROM analytics.interactions
  GROUP BY (date_trunc('day'::text, (interactions.interaction_time)::timestamp without time zone)), interactions.user_id
  ORDER BY (date_trunc('day'::text, (interactions.interaction_time)::timestamp without time zone)) DESC, interactions.user_id;


CREATE OR REPLACE FUNCTION analytics.refresh_materialized_views()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION analytics.route_interaction_to_partition()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE UNIQUE INDEX idx_mv_daily_activity_summary_day ON analytics.mv_daily_activity_summary USING btree (day);

CREATE UNIQUE INDEX idx_mv_user_activity_timeline_day_user ON analytics.mv_user_activity_timeline USING btree (day, user_id);

grant select on table "analytics"."interaction_metrics" to "anon";

grant select on table "analytics"."interaction_metrics" to "authenticated";

grant delete on table "analytics"."interaction_metrics" to "service_role";

grant insert on table "analytics"."interaction_metrics" to "service_role";

grant references on table "analytics"."interaction_metrics" to "service_role";

grant select on table "analytics"."interaction_metrics" to "service_role";

grant trigger on table "analytics"."interaction_metrics" to "service_role";

grant truncate on table "analytics"."interaction_metrics" to "service_role";

grant update on table "analytics"."interaction_metrics" to "service_role";

grant select on table "analytics"."interactions" to "anon";

grant select on table "analytics"."interactions" to "authenticated";

grant delete on table "analytics"."interactions" to "service_role";

grant insert on table "analytics"."interactions" to "service_role";

grant references on table "analytics"."interactions" to "service_role";

grant select on table "analytics"."interactions" to "service_role";

grant trigger on table "analytics"."interactions" to "service_role";

grant truncate on table "analytics"."interactions" to "service_role";

grant update on table "analytics"."interactions" to "service_role";

grant select on table "analytics"."interactions_p2024_05" to "anon";

grant select on table "analytics"."interactions_p2024_05" to "authenticated";

grant delete on table "analytics"."interactions_p2024_05" to "service_role";

grant insert on table "analytics"."interactions_p2024_05" to "service_role";

grant references on table "analytics"."interactions_p2024_05" to "service_role";

grant select on table "analytics"."interactions_p2024_05" to "service_role";

grant trigger on table "analytics"."interactions_p2024_05" to "service_role";

grant truncate on table "analytics"."interactions_p2024_05" to "service_role";

grant update on table "analytics"."interactions_p2024_05" to "service_role";

grant select on table "analytics"."interactions_p2024_06" to "anon";

grant select on table "analytics"."interactions_p2024_06" to "authenticated";

grant delete on table "analytics"."interactions_p2024_06" to "service_role";

grant insert on table "analytics"."interactions_p2024_06" to "service_role";

grant references on table "analytics"."interactions_p2024_06" to "service_role";

grant select on table "analytics"."interactions_p2024_06" to "service_role";

grant trigger on table "analytics"."interactions_p2024_06" to "service_role";

grant truncate on table "analytics"."interactions_p2024_06" to "service_role";

grant update on table "analytics"."interactions_p2024_06" to "service_role";

grant select on table "analytics"."interactions_p2024_07" to "anon";

grant select on table "analytics"."interactions_p2024_07" to "authenticated";

grant delete on table "analytics"."interactions_p2024_07" to "service_role";

grant insert on table "analytics"."interactions_p2024_07" to "service_role";

grant references on table "analytics"."interactions_p2024_07" to "service_role";

grant select on table "analytics"."interactions_p2024_07" to "service_role";

grant trigger on table "analytics"."interactions_p2024_07" to "service_role";

grant truncate on table "analytics"."interactions_p2024_07" to "service_role";

grant update on table "analytics"."interactions_p2024_07" to "service_role";

grant select on table "analytics"."interactions_p2024_08" to "anon";

grant select on table "analytics"."interactions_p2024_08" to "authenticated";

grant delete on table "analytics"."interactions_p2024_08" to "service_role";

grant insert on table "analytics"."interactions_p2024_08" to "service_role";

grant references on table "analytics"."interactions_p2024_08" to "service_role";

grant select on table "analytics"."interactions_p2024_08" to "service_role";

grant trigger on table "analytics"."interactions_p2024_08" to "service_role";

grant truncate on table "analytics"."interactions_p2024_08" to "service_role";

grant update on table "analytics"."interactions_p2024_08" to "service_role";

grant select on table "analytics"."interactions_p2024_09" to "anon";

grant select on table "analytics"."interactions_p2024_09" to "authenticated";

grant delete on table "analytics"."interactions_p2024_09" to "service_role";

grant insert on table "analytics"."interactions_p2024_09" to "service_role";

grant references on table "analytics"."interactions_p2024_09" to "service_role";

grant select on table "analytics"."interactions_p2024_09" to "service_role";

grant trigger on table "analytics"."interactions_p2024_09" to "service_role";

grant truncate on table "analytics"."interactions_p2024_09" to "service_role";

grant update on table "analytics"."interactions_p2024_09" to "service_role";

grant select on table "analytics"."interactions_p2024_10" to "anon";

grant select on table "analytics"."interactions_p2024_10" to "authenticated";

grant delete on table "analytics"."interactions_p2024_10" to "service_role";

grant insert on table "analytics"."interactions_p2024_10" to "service_role";

grant references on table "analytics"."interactions_p2024_10" to "service_role";

grant select on table "analytics"."interactions_p2024_10" to "service_role";

grant trigger on table "analytics"."interactions_p2024_10" to "service_role";

grant truncate on table "analytics"."interactions_p2024_10" to "service_role";

grant update on table "analytics"."interactions_p2024_10" to "service_role";

grant select on table "analytics"."interactions_p2024_11" to "anon";

grant select on table "analytics"."interactions_p2024_11" to "authenticated";

grant delete on table "analytics"."interactions_p2024_11" to "service_role";

grant insert on table "analytics"."interactions_p2024_11" to "service_role";

grant references on table "analytics"."interactions_p2024_11" to "service_role";

grant select on table "analytics"."interactions_p2024_11" to "service_role";

grant trigger on table "analytics"."interactions_p2024_11" to "service_role";

grant truncate on table "analytics"."interactions_p2024_11" to "service_role";

grant update on table "analytics"."interactions_p2024_11" to "service_role";

grant select on table "analytics"."interactions_p2024_12" to "anon";

grant select on table "analytics"."interactions_p2024_12" to "authenticated";

grant delete on table "analytics"."interactions_p2024_12" to "service_role";

grant insert on table "analytics"."interactions_p2024_12" to "service_role";

grant references on table "analytics"."interactions_p2024_12" to "service_role";

grant select on table "analytics"."interactions_p2024_12" to "service_role";

grant trigger on table "analytics"."interactions_p2024_12" to "service_role";

grant truncate on table "analytics"."interactions_p2024_12" to "service_role";

grant update on table "analytics"."interactions_p2024_12" to "service_role";

grant select on table "analytics"."interactions_p2025_01" to "anon";

grant select on table "analytics"."interactions_p2025_01" to "authenticated";

grant delete on table "analytics"."interactions_p2025_01" to "service_role";

grant insert on table "analytics"."interactions_p2025_01" to "service_role";

grant references on table "analytics"."interactions_p2025_01" to "service_role";

grant select on table "analytics"."interactions_p2025_01" to "service_role";

grant trigger on table "analytics"."interactions_p2025_01" to "service_role";

grant truncate on table "analytics"."interactions_p2025_01" to "service_role";

grant update on table "analytics"."interactions_p2025_01" to "service_role";

grant select on table "analytics"."interactions_p2025_02" to "anon";

grant select on table "analytics"."interactions_p2025_02" to "authenticated";

grant delete on table "analytics"."interactions_p2025_02" to "service_role";

grant insert on table "analytics"."interactions_p2025_02" to "service_role";

grant references on table "analytics"."interactions_p2025_02" to "service_role";

grant select on table "analytics"."interactions_p2025_02" to "service_role";

grant trigger on table "analytics"."interactions_p2025_02" to "service_role";

grant truncate on table "analytics"."interactions_p2025_02" to "service_role";

grant update on table "analytics"."interactions_p2025_02" to "service_role";

grant select on table "analytics"."interactions_p2025_03" to "anon";

grant select on table "analytics"."interactions_p2025_03" to "authenticated";

grant delete on table "analytics"."interactions_p2025_03" to "service_role";

grant insert on table "analytics"."interactions_p2025_03" to "service_role";

grant references on table "analytics"."interactions_p2025_03" to "service_role";

grant select on table "analytics"."interactions_p2025_03" to "service_role";

grant trigger on table "analytics"."interactions_p2025_03" to "service_role";

grant truncate on table "analytics"."interactions_p2025_03" to "service_role";

grant update on table "analytics"."interactions_p2025_03" to "service_role";

grant select on table "analytics"."interactions_p2025_04" to "anon";

grant select on table "analytics"."interactions_p2025_04" to "authenticated";

grant delete on table "analytics"."interactions_p2025_04" to "service_role";

grant insert on table "analytics"."interactions_p2025_04" to "service_role";

grant references on table "analytics"."interactions_p2025_04" to "service_role";

grant select on table "analytics"."interactions_p2025_04" to "service_role";

grant trigger on table "analytics"."interactions_p2025_04" to "service_role";

grant truncate on table "analytics"."interactions_p2025_04" to "service_role";

grant update on table "analytics"."interactions_p2025_04" to "service_role";

grant select on table "analytics"."interactions_p2025_05" to "anon";

grant select on table "analytics"."interactions_p2025_05" to "authenticated";

grant delete on table "analytics"."interactions_p2025_05" to "service_role";

grant insert on table "analytics"."interactions_p2025_05" to "service_role";

grant references on table "analytics"."interactions_p2025_05" to "service_role";

grant select on table "analytics"."interactions_p2025_05" to "service_role";

grant trigger on table "analytics"."interactions_p2025_05" to "service_role";

grant truncate on table "analytics"."interactions_p2025_05" to "service_role";

grant update on table "analytics"."interactions_p2025_05" to "service_role";

grant select on table "analytics"."interactions_p2025_06" to "anon";

grant select on table "analytics"."interactions_p2025_06" to "authenticated";

grant delete on table "analytics"."interactions_p2025_06" to "service_role";

grant insert on table "analytics"."interactions_p2025_06" to "service_role";

grant references on table "analytics"."interactions_p2025_06" to "service_role";

grant select on table "analytics"."interactions_p2025_06" to "service_role";

grant trigger on table "analytics"."interactions_p2025_06" to "service_role";

grant truncate on table "analytics"."interactions_p2025_06" to "service_role";

grant update on table "analytics"."interactions_p2025_06" to "service_role";

grant select on table "analytics"."interactions_p2025_07" to "anon";

grant select on table "analytics"."interactions_p2025_07" to "authenticated";

grant delete on table "analytics"."interactions_p2025_07" to "service_role";

grant insert on table "analytics"."interactions_p2025_07" to "service_role";

grant references on table "analytics"."interactions_p2025_07" to "service_role";

grant select on table "analytics"."interactions_p2025_07" to "service_role";

grant trigger on table "analytics"."interactions_p2025_07" to "service_role";

grant truncate on table "analytics"."interactions_p2025_07" to "service_role";

grant update on table "analytics"."interactions_p2025_07" to "service_role";

grant select on table "analytics"."interactions_p2025_08" to "anon";

grant select on table "analytics"."interactions_p2025_08" to "authenticated";

grant delete on table "analytics"."interactions_p2025_08" to "service_role";

grant insert on table "analytics"."interactions_p2025_08" to "service_role";

grant references on table "analytics"."interactions_p2025_08" to "service_role";

grant select on table "analytics"."interactions_p2025_08" to "service_role";

grant trigger on table "analytics"."interactions_p2025_08" to "service_role";

grant truncate on table "analytics"."interactions_p2025_08" to "service_role";

grant update on table "analytics"."interactions_p2025_08" to "service_role";

grant select on table "analytics"."interactions_p2025_09" to "anon";

grant select on table "analytics"."interactions_p2025_09" to "authenticated";

grant delete on table "analytics"."interactions_p2025_09" to "service_role";

grant insert on table "analytics"."interactions_p2025_09" to "service_role";

grant references on table "analytics"."interactions_p2025_09" to "service_role";

grant select on table "analytics"."interactions_p2025_09" to "service_role";

grant trigger on table "analytics"."interactions_p2025_09" to "service_role";

grant truncate on table "analytics"."interactions_p2025_09" to "service_role";

grant update on table "analytics"."interactions_p2025_09" to "service_role";

grant select on table "analytics"."interactions_p2025_10" to "anon";

grant select on table "analytics"."interactions_p2025_10" to "authenticated";

grant delete on table "analytics"."interactions_p2025_10" to "service_role";

grant insert on table "analytics"."interactions_p2025_10" to "service_role";

grant references on table "analytics"."interactions_p2025_10" to "service_role";

grant select on table "analytics"."interactions_p2025_10" to "service_role";

grant trigger on table "analytics"."interactions_p2025_10" to "service_role";

grant truncate on table "analytics"."interactions_p2025_10" to "service_role";

grant update on table "analytics"."interactions_p2025_10" to "service_role";

grant select on table "analytics"."interactions_p2025_11" to "anon";

grant select on table "analytics"."interactions_p2025_11" to "authenticated";

grant delete on table "analytics"."interactions_p2025_11" to "service_role";

grant insert on table "analytics"."interactions_p2025_11" to "service_role";

grant references on table "analytics"."interactions_p2025_11" to "service_role";

grant select on table "analytics"."interactions_p2025_11" to "service_role";

grant trigger on table "analytics"."interactions_p2025_11" to "service_role";

grant truncate on table "analytics"."interactions_p2025_11" to "service_role";

grant update on table "analytics"."interactions_p2025_11" to "service_role";

grant select on table "analytics"."interactions_p2025_12" to "anon";

grant select on table "analytics"."interactions_p2025_12" to "authenticated";

grant delete on table "analytics"."interactions_p2025_12" to "service_role";

grant insert on table "analytics"."interactions_p2025_12" to "service_role";

grant references on table "analytics"."interactions_p2025_12" to "service_role";

grant select on table "analytics"."interactions_p2025_12" to "service_role";

grant trigger on table "analytics"."interactions_p2025_12" to "service_role";

grant truncate on table "analytics"."interactions_p2025_12" to "service_role";

grant update on table "analytics"."interactions_p2025_12" to "service_role";

grant select on table "analytics"."interactions_p2026_01" to "anon";

grant select on table "analytics"."interactions_p2026_01" to "authenticated";

grant delete on table "analytics"."interactions_p2026_01" to "service_role";

grant insert on table "analytics"."interactions_p2026_01" to "service_role";

grant references on table "analytics"."interactions_p2026_01" to "service_role";

grant select on table "analytics"."interactions_p2026_01" to "service_role";

grant trigger on table "analytics"."interactions_p2026_01" to "service_role";

grant truncate on table "analytics"."interactions_p2026_01" to "service_role";

grant update on table "analytics"."interactions_p2026_01" to "service_role";

grant select on table "analytics"."interactions_p2026_02" to "anon";

grant select on table "analytics"."interactions_p2026_02" to "authenticated";

grant delete on table "analytics"."interactions_p2026_02" to "service_role";

grant insert on table "analytics"."interactions_p2026_02" to "service_role";

grant references on table "analytics"."interactions_p2026_02" to "service_role";

grant select on table "analytics"."interactions_p2026_02" to "service_role";

grant trigger on table "analytics"."interactions_p2026_02" to "service_role";

grant truncate on table "analytics"."interactions_p2026_02" to "service_role";

grant update on table "analytics"."interactions_p2026_02" to "service_role";

grant select on table "analytics"."interactions_p2026_03" to "anon";

grant select on table "analytics"."interactions_p2026_03" to "authenticated";

grant delete on table "analytics"."interactions_p2026_03" to "service_role";

grant insert on table "analytics"."interactions_p2026_03" to "service_role";

grant references on table "analytics"."interactions_p2026_03" to "service_role";

grant select on table "analytics"."interactions_p2026_03" to "service_role";

grant trigger on table "analytics"."interactions_p2026_03" to "service_role";

grant truncate on table "analytics"."interactions_p2026_03" to "service_role";

grant update on table "analytics"."interactions_p2026_03" to "service_role";

grant select on table "analytics"."interactions_p2026_04" to "anon";

grant select on table "analytics"."interactions_p2026_04" to "authenticated";

grant delete on table "analytics"."interactions_p2026_04" to "service_role";

grant insert on table "analytics"."interactions_p2026_04" to "service_role";

grant references on table "analytics"."interactions_p2026_04" to "service_role";

grant select on table "analytics"."interactions_p2026_04" to "service_role";

grant trigger on table "analytics"."interactions_p2026_04" to "service_role";

grant truncate on table "analytics"."interactions_p2026_04" to "service_role";

grant update on table "analytics"."interactions_p2026_04" to "service_role";

grant select on table "analytics"."interactions_p2026_05" to "anon";

grant select on table "analytics"."interactions_p2026_05" to "authenticated";

grant delete on table "analytics"."interactions_p2026_05" to "service_role";

grant insert on table "analytics"."interactions_p2026_05" to "service_role";

grant references on table "analytics"."interactions_p2026_05" to "service_role";

grant select on table "analytics"."interactions_p2026_05" to "service_role";

grant trigger on table "analytics"."interactions_p2026_05" to "service_role";

grant truncate on table "analytics"."interactions_p2026_05" to "service_role";

grant update on table "analytics"."interactions_p2026_05" to "service_role";

grant select on table "analytics"."interactions_partitioned" to "anon";

grant select on table "analytics"."interactions_partitioned" to "authenticated";

grant delete on table "analytics"."interactions_partitioned" to "service_role";

grant insert on table "analytics"."interactions_partitioned" to "service_role";

grant references on table "analytics"."interactions_partitioned" to "service_role";

grant select on table "analytics"."interactions_partitioned" to "service_role";

grant trigger on table "analytics"."interactions_partitioned" to "service_role";

grant truncate on table "analytics"."interactions_partitioned" to "service_role";

grant update on table "analytics"."interactions_partitioned" to "service_role";

create policy "interaction_metrics_admin_policy"
on "analytics"."interaction_metrics"
as permissive
for all
to authenticated
using (auth.is_admin());


create policy "interaction_metrics_service_role_policy"
on "analytics"."interaction_metrics"
as permissive
for all
to service_role
using (true);


create policy "interaction_metrics_user_policy"
on "analytics"."interaction_metrics"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM analytics.interactions i
  WHERE ((i.id = interaction_metrics.interaction_id) AND ((i.user_id = auth.uid()) OR auth.owns_assistant(i.assistant_id))))));


create policy "interactions_admin_policy"
on "analytics"."interactions"
as permissive
for all
to authenticated
using (auth.is_admin());


create policy "interactions_assistant_owner_policy"
on "analytics"."interactions"
as permissive
for select
to authenticated
using (auth.owns_assistant(assistant_id));


create policy "interactions_service_role_policy"
on "analytics"."interactions"
as permissive
for all
to service_role
using (true);


create policy "interactions_user_own_data_policy"
on "analytics"."interactions"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "interactions_p2024_05_admin_policy"
on "analytics"."interactions_p2024_05"
as permissive
for all
to authenticated
using (auth.is_admin());


create policy "interactions_p2024_05_assistant_owner_policy"
on "analytics"."interactions_p2024_05"
as permissive
for select
to authenticated
using (auth.owns_assistant(assistant_id));


create policy "interactions_p2024_05_service_role_policy"
on "analytics"."interactions_p2024_05"
as permissive
for all
to service_role
using (true);


create policy "interactions_p2024_05_user_own_data_policy"
on "analytics"."interactions_p2024_05"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "interactions_p2024_06_admin_policy"
on "analytics"."interactions_p2024_06"
as permissive
for all
to authenticated
using (auth.is_admin());


create policy "interactions_p2024_06_assistant_owner_policy"
on "analytics"."interactions_p2024_06"
as permissive
for select
to authenticated
using (auth.owns_assistant(assistant_id));


create policy "interactions_p2024_06_service_role_policy"
on "analytics"."interactions_p2024_06"
as permissive
for all
to service_role
using (true);


create policy "interactions_p2024_06_user_own_data_policy"
on "analytics"."interactions_p2024_06"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "interactions_p2024_07_admin_policy"
on "analytics"."interactions_p2024_07"
as permissive
for all
to authenticated
using (auth.is_admin());


create policy "interactions_p2024_07_assistant_owner_policy"
on "analytics"."interactions_p2024_07"
as permissive
for select
to authenticated
using (auth.owns_assistant(assistant_id));


create policy "interactions_p2024_07_service_role_policy"
on "analytics"."interactions_p2024_07"
as permissive
for all
to service_role
using (true);


create policy "interactions_p2024_07_user_own_data_policy"
on "analytics"."interactions_p2024_07"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "interactions_p2024_08_admin_policy"
on "analytics"."interactions_p2024_08"
as permissive
for all
to authenticated
using (auth.is_admin());


create policy "interactions_p2024_08_assistant_owner_policy"
on "analytics"."interactions_p2024_08"
as permissive
for select
to authenticated
using (auth.owns_assistant(assistant_id));


create policy "interactions_p2024_08_service_role_policy"
on "analytics"."interactions_p2024_08"
as permissive
for all
to service_role
using (true);


create policy "interactions_p2024_08_user_own_data_policy"
on "analytics"."interactions_p2024_08"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "interactions_p2024_09_admin_policy"
on "analytics"."interactions_p2024_09"
as permissive
for all
to authenticated
using (auth.is_admin());


create policy "interactions_p2024_09_assistant_owner_policy"
on "analytics"."interactions_p2024_09"
as permissive
for select
to authenticated
using (auth.owns_assistant(assistant_id));


create policy "interactions_p2024_09_service_role_policy"
on "analytics"."interactions_p2024_09"
as permissive
for all
to service_role
using (true);


create policy "interactions_p2024_09_user_own_data_policy"
on "analytics"."interactions_p2024_09"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "interactions_p2024_10_admin_policy"
on "analytics"."interactions_p2024_10"
as permissive
for all
to authenticated
using (auth.is_admin());


create policy "interactions_p2024_10_assistant_owner_policy"
on "analytics"."interactions_p2024_10"
as permissive
for select
to authenticated
using (auth.owns_assistant(assistant_id));


create policy "interactions_p2024_10_service_role_policy"
on "analytics"."interactions_p2024_10"
as permissive
for all
to service_role
using (true);


create policy "interactions_p2024_10_user_own_data_policy"
on "analytics"."interactions_p2024_10"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "interactions_p2024_11_admin_policy"
on "analytics"."interactions_p2024_11"
as permissive
for all
to authenticated
using (auth.is_admin());


create policy "interactions_p2024_11_assistant_owner_policy"
on "analytics"."interactions_p2024_11"
as permissive
for select
to authenticated
using (auth.owns_assistant(assistant_id));


create policy "interactions_p2024_11_service_role_policy"
on "analytics"."interactions_p2024_11"
as permissive
for all
to service_role
using (true);


create policy "interactions_p2024_11_user_own_data_policy"
on "analytics"."interactions_p2024_11"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "interactions_p2024_12_admin_policy"
on "analytics"."interactions_p2024_12"
as permissive
for all
to authenticated
using (auth.is_admin());


create policy "interactions_p2024_12_assistant_owner_policy"
on "analytics"."interactions_p2024_12"
as permissive
for select
to authenticated
using (auth.owns_assistant(assistant_id));


create policy "interactions_p2024_12_service_role_policy"
on "analytics"."interactions_p2024_12"
as permissive
for all
to service_role
using (true);


create policy "interactions_p2024_12_user_own_data_policy"
on "analytics"."interactions_p2024_12"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "interactions_p2025_01_admin_policy"
on "analytics"."interactions_p2025_01"
as permissive
for all
to authenticated
using (auth.is_admin());


create policy "interactions_p2025_01_assistant_owner_policy"
on "analytics"."interactions_p2025_01"
as permissive
for select
to authenticated
using (auth.owns_assistant(assistant_id));


create policy "interactions_p2025_01_service_role_policy"
on "analytics"."interactions_p2025_01"
as permissive
for all
to service_role
using (true);


create policy "interactions_p2025_01_user_own_data_policy"
on "analytics"."interactions_p2025_01"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "interactions_p2025_02_admin_policy"
on "analytics"."interactions_p2025_02"
as permissive
for all
to authenticated
using (auth.is_admin());


create policy "interactions_p2025_02_assistant_owner_policy"
on "analytics"."interactions_p2025_02"
as permissive
for select
to authenticated
using (auth.owns_assistant(assistant_id));


create policy "interactions_p2025_02_service_role_policy"
on "analytics"."interactions_p2025_02"
as permissive
for all
to service_role
using (true);


create policy "interactions_p2025_02_user_own_data_policy"
on "analytics"."interactions_p2025_02"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "interactions_p2025_03_admin_policy"
on "analytics"."interactions_p2025_03"
as permissive
for all
to authenticated
using (auth.is_admin());


create policy "interactions_p2025_03_assistant_owner_policy"
on "analytics"."interactions_p2025_03"
as permissive
for select
to authenticated
using (auth.owns_assistant(assistant_id));


create policy "interactions_p2025_03_service_role_policy"
on "analytics"."interactions_p2025_03"
as permissive
for all
to service_role
using (true);


create policy "interactions_p2025_03_user_own_data_policy"
on "analytics"."interactions_p2025_03"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "interactions_p2025_04_admin_policy"
on "analytics"."interactions_p2025_04"
as permissive
for all
to authenticated
using (auth.is_admin());


create policy "interactions_p2025_04_assistant_owner_policy"
on "analytics"."interactions_p2025_04"
as permissive
for select
to authenticated
using (auth.owns_assistant(assistant_id));


create policy "interactions_p2025_04_service_role_policy"
on "analytics"."interactions_p2025_04"
as permissive
for all
to service_role
using (true);


create policy "interactions_p2025_04_user_own_data_policy"
on "analytics"."interactions_p2025_04"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "interactions_p2025_05_admin_policy"
on "analytics"."interactions_p2025_05"
as permissive
for all
to authenticated
using (auth.is_admin());


create policy "interactions_p2025_05_assistant_owner_policy"
on "analytics"."interactions_p2025_05"
as permissive
for select
to authenticated
using (auth.owns_assistant(assistant_id));


create policy "interactions_p2025_05_service_role_policy"
on "analytics"."interactions_p2025_05"
as permissive
for all
to service_role
using (true);


create policy "interactions_p2025_05_user_own_data_policy"
on "analytics"."interactions_p2025_05"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "interactions_p2025_06_admin_policy"
on "analytics"."interactions_p2025_06"
as permissive
for all
to authenticated
using (auth.is_admin());


create policy "interactions_p2025_06_assistant_owner_policy"
on "analytics"."interactions_p2025_06"
as permissive
for select
to authenticated
using (auth.owns_assistant(assistant_id));


create policy "interactions_p2025_06_service_role_policy"
on "analytics"."interactions_p2025_06"
as permissive
for all
to service_role
using (true);


create policy "interactions_p2025_06_user_own_data_policy"
on "analytics"."interactions_p2025_06"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "interactions_p2025_07_admin_policy"
on "analytics"."interactions_p2025_07"
as permissive
for all
to authenticated
using (auth.is_admin());


create policy "interactions_p2025_07_assistant_owner_policy"
on "analytics"."interactions_p2025_07"
as permissive
for select
to authenticated
using (auth.owns_assistant(assistant_id));


create policy "interactions_p2025_07_service_role_policy"
on "analytics"."interactions_p2025_07"
as permissive
for all
to service_role
using (true);


create policy "interactions_p2025_07_user_own_data_policy"
on "analytics"."interactions_p2025_07"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "interactions_p2025_08_admin_policy"
on "analytics"."interactions_p2025_08"
as permissive
for all
to authenticated
using (auth.is_admin());


create policy "interactions_p2025_08_assistant_owner_policy"
on "analytics"."interactions_p2025_08"
as permissive
for select
to authenticated
using (auth.owns_assistant(assistant_id));


create policy "interactions_p2025_08_service_role_policy"
on "analytics"."interactions_p2025_08"
as permissive
for all
to service_role
using (true);


create policy "interactions_p2025_08_user_own_data_policy"
on "analytics"."interactions_p2025_08"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "interactions_p2025_09_admin_policy"
on "analytics"."interactions_p2025_09"
as permissive
for all
to authenticated
using (auth.is_admin());


create policy "interactions_p2025_09_assistant_owner_policy"
on "analytics"."interactions_p2025_09"
as permissive
for select
to authenticated
using (auth.owns_assistant(assistant_id));


create policy "interactions_p2025_09_service_role_policy"
on "analytics"."interactions_p2025_09"
as permissive
for all
to service_role
using (true);


create policy "interactions_p2025_09_user_own_data_policy"
on "analytics"."interactions_p2025_09"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "interactions_p2025_10_admin_policy"
on "analytics"."interactions_p2025_10"
as permissive
for all
to authenticated
using (auth.is_admin());


create policy "interactions_p2025_10_assistant_owner_policy"
on "analytics"."interactions_p2025_10"
as permissive
for select
to authenticated
using (auth.owns_assistant(assistant_id));


create policy "interactions_p2025_10_service_role_policy"
on "analytics"."interactions_p2025_10"
as permissive
for all
to service_role
using (true);


create policy "interactions_p2025_10_user_own_data_policy"
on "analytics"."interactions_p2025_10"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "interactions_p2025_11_admin_policy"
on "analytics"."interactions_p2025_11"
as permissive
for all
to authenticated
using (auth.is_admin());


create policy "interactions_p2025_11_assistant_owner_policy"
on "analytics"."interactions_p2025_11"
as permissive
for select
to authenticated
using (auth.owns_assistant(assistant_id));


create policy "interactions_p2025_11_service_role_policy"
on "analytics"."interactions_p2025_11"
as permissive
for all
to service_role
using (true);


create policy "interactions_p2025_11_user_own_data_policy"
on "analytics"."interactions_p2025_11"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "interactions_p2025_12_admin_policy"
on "analytics"."interactions_p2025_12"
as permissive
for all
to authenticated
using (auth.is_admin());


create policy "interactions_p2025_12_assistant_owner_policy"
on "analytics"."interactions_p2025_12"
as permissive
for select
to authenticated
using (auth.owns_assistant(assistant_id));


create policy "interactions_p2025_12_service_role_policy"
on "analytics"."interactions_p2025_12"
as permissive
for all
to service_role
using (true);


create policy "interactions_p2025_12_user_own_data_policy"
on "analytics"."interactions_p2025_12"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "interactions_p2026_01_admin_policy"
on "analytics"."interactions_p2026_01"
as permissive
for all
to authenticated
using (auth.is_admin());


create policy "interactions_p2026_01_assistant_owner_policy"
on "analytics"."interactions_p2026_01"
as permissive
for select
to authenticated
using (auth.owns_assistant(assistant_id));


create policy "interactions_p2026_01_service_role_policy"
on "analytics"."interactions_p2026_01"
as permissive
for all
to service_role
using (true);


create policy "interactions_p2026_01_user_own_data_policy"
on "analytics"."interactions_p2026_01"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "interactions_p2026_02_admin_policy"
on "analytics"."interactions_p2026_02"
as permissive
for all
to authenticated
using (auth.is_admin());


create policy "interactions_p2026_02_assistant_owner_policy"
on "analytics"."interactions_p2026_02"
as permissive
for select
to authenticated
using (auth.owns_assistant(assistant_id));


create policy "interactions_p2026_02_service_role_policy"
on "analytics"."interactions_p2026_02"
as permissive
for all
to service_role
using (true);


create policy "interactions_p2026_02_user_own_data_policy"
on "analytics"."interactions_p2026_02"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "interactions_p2026_03_admin_policy"
on "analytics"."interactions_p2026_03"
as permissive
for all
to authenticated
using (auth.is_admin());


create policy "interactions_p2026_03_assistant_owner_policy"
on "analytics"."interactions_p2026_03"
as permissive
for select
to authenticated
using (auth.owns_assistant(assistant_id));


create policy "interactions_p2026_03_service_role_policy"
on "analytics"."interactions_p2026_03"
as permissive
for all
to service_role
using (true);


create policy "interactions_p2026_03_user_own_data_policy"
on "analytics"."interactions_p2026_03"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "interactions_p2026_04_admin_policy"
on "analytics"."interactions_p2026_04"
as permissive
for all
to authenticated
using (auth.is_admin());


create policy "interactions_p2026_04_assistant_owner_policy"
on "analytics"."interactions_p2026_04"
as permissive
for select
to authenticated
using (auth.owns_assistant(assistant_id));


create policy "interactions_p2026_04_service_role_policy"
on "analytics"."interactions_p2026_04"
as permissive
for all
to service_role
using (true);


create policy "interactions_p2026_04_user_own_data_policy"
on "analytics"."interactions_p2026_04"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "interactions_p2026_05_admin_policy"
on "analytics"."interactions_p2026_05"
as permissive
for all
to authenticated
using (auth.is_admin());


create policy "interactions_p2026_05_assistant_owner_policy"
on "analytics"."interactions_p2026_05"
as permissive
for select
to authenticated
using (auth.owns_assistant(assistant_id));


create policy "interactions_p2026_05_service_role_policy"
on "analytics"."interactions_p2026_05"
as permissive
for all
to service_role
using (true);


create policy "interactions_p2026_05_user_own_data_policy"
on "analytics"."interactions_p2026_05"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "interactions_partitioned_admin_policy"
on "analytics"."interactions_partitioned"
as permissive
for all
to authenticated
using (auth.is_admin());


create policy "interactions_partitioned_assistant_owner_policy"
on "analytics"."interactions_partitioned"
as permissive
for select
to authenticated
using (auth.owns_assistant(assistant_id));


create policy "interactions_partitioned_service_role_policy"
on "analytics"."interactions_partitioned"
as permissive
for all
to service_role
using (true);


create policy "interactions_partitioned_user_own_data_policy"
on "analytics"."interactions_partitioned"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "interactions_shadow_admin_policy"
on "analytics"."interactions_shadow"
as permissive
for all
to authenticated
using (auth.is_admin());


create policy "interactions_shadow_assistant_owner_policy"
on "analytics"."interactions_shadow"
as permissive
for select
to authenticated
using (auth.owns_assistant(assistant_id));


create policy "interactions_shadow_service_role_policy"
on "analytics"."interactions_shadow"
as permissive
for all
to service_role
using (true);


create policy "interactions_shadow_user_own_data_policy"
on "analytics"."interactions_shadow"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


CREATE TRIGGER route_interaction_trigger BEFORE INSERT ON analytics.interactions_shadow FOR EACH ROW EXECUTE FUNCTION analytics.route_interaction_to_partition();


create schema if not exists "assistants";

create table "assistants"."assistant_activity" (
    "assistant_id" uuid not null,
    "total_messages" integer default 0,
    "total_tokens" integer default 0,
    "total_documents" integer default 0,
    "total_webpages" integer default 0,
    "last_message_at" timestamp with time zone,
    "last_used_at" timestamp with time zone default now(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "assistants"."assistant_activity" enable row level security;

create table "assistants"."assistant_configs" (
    "id" uuid not null,
    "description" text,
    "concierge_name" text,
    "concierge_personality" text,
    "business_name" text,
    "business_phone" text,
    "share_phone_number" boolean default false,
    "system_prompt" text,
    "pinecone_name" text,
    "website" text,
    "email" text,
    "address" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "assistants"."assistant_configs" enable row level security;

create table "assistants"."assistant_contact_info" (
    "assistant_id" uuid not null,
    "share_phone_number" boolean default false,
    "business_phone" text,
    "email" text,
    "website" text,
    "address" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "assistants"."assistant_contact_info" enable row level security;

create table "assistants"."assistant_settings" (
    "assistant_id" uuid not null,
    "system_prompt" text,
    "description" text,
    "display_name" text,
    "personality" text,
    "business_name" text,
    "pinecone_name" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "assistants"."assistant_settings" enable row level security;

create table "assistants"."assistant_subscriptions" (
    "id" uuid not null default gen_random_uuid(),
    "assistant_id" uuid not null,
    "plan_id" uuid not null,
    "stripe_subscription_id" text,
    "status" text not null,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "cancel_at_period_end" boolean default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "assistants"."assistant_subscriptions" enable row level security;

create table "assistants"."assistant_usage_limits" (
    "assistant_id" uuid not null,
    "message_limit" integer default 100,
    "token_limit" integer default 100000,
    "document_limit" integer default 5,
    "webpage_limit" integer default 5,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "assistants"."assistant_usage_limits" enable row level security;

create table "assistants"."assistants" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "name" text not null,
    "is_starred" boolean default false,
    "pending" boolean default false,
    "assigned_phone_number" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "assistants"."assistants" enable row level security;

CREATE INDEX assistant_activity_last_message_at_idx ON assistants.assistant_activity USING btree (last_message_at DESC);

CREATE INDEX assistant_activity_last_used_at_idx ON assistants.assistant_activity USING btree (last_used_at);

CREATE INDEX assistant_activity_last_used_at_idx1 ON assistants.assistant_activity USING btree (last_used_at DESC);

CREATE UNIQUE INDEX assistant_activity_pkey ON assistants.assistant_activity USING btree (assistant_id);

CREATE INDEX assistant_configs_business_name_idx ON assistants.assistant_configs USING btree (business_name);

CREATE UNIQUE INDEX assistant_configs_pinecone_name_key ON assistants.assistant_configs USING btree (pinecone_name);

CREATE UNIQUE INDEX assistant_configs_pkey ON assistants.assistant_configs USING btree (id);

CREATE UNIQUE INDEX assistant_contact_info_pkey ON assistants.assistant_contact_info USING btree (assistant_id);

CREATE UNIQUE INDEX assistant_settings_pinecone_name_key ON assistants.assistant_settings USING btree (pinecone_name);

CREATE UNIQUE INDEX assistant_settings_pkey ON assistants.assistant_settings USING btree (assistant_id);

CREATE UNIQUE INDEX assistant_subscriptions_assistant_id_key ON assistants.assistant_subscriptions USING btree (assistant_id);

CREATE UNIQUE INDEX assistant_subscriptions_pkey ON assistants.assistant_subscriptions USING btree (id);

CREATE INDEX assistant_subscriptions_status_idx ON assistants.assistant_subscriptions USING btree (status);

CREATE UNIQUE INDEX assistant_subscriptions_stripe_subscription_id_key ON assistants.assistant_subscriptions USING btree (stripe_subscription_id);

CREATE UNIQUE INDEX assistant_usage_limits_pkey ON assistants.assistant_usage_limits USING btree (assistant_id);

CREATE INDEX assistants_name_idx ON assistants.assistants USING btree (name);

CREATE INDEX assistants_pending_idx ON assistants.assistants USING btree (pending) WHERE (pending = true);

CREATE UNIQUE INDEX assistants_pkey ON assistants.assistants USING btree (id);

CREATE INDEX assistants_user_id_created_at_idx ON assistants.assistants USING btree (user_id, created_at DESC);

CREATE INDEX assistants_user_id_idx ON assistants.assistants USING btree (user_id);

alter table "assistants"."assistant_activity" add constraint "assistant_activity_pkey" PRIMARY KEY using index "assistant_activity_pkey";

alter table "assistants"."assistant_configs" add constraint "assistant_configs_pkey" PRIMARY KEY using index "assistant_configs_pkey";

alter table "assistants"."assistant_contact_info" add constraint "assistant_contact_info_pkey" PRIMARY KEY using index "assistant_contact_info_pkey";

alter table "assistants"."assistant_settings" add constraint "assistant_settings_pkey" PRIMARY KEY using index "assistant_settings_pkey";

alter table "assistants"."assistant_subscriptions" add constraint "assistant_subscriptions_pkey" PRIMARY KEY using index "assistant_subscriptions_pkey";

alter table "assistants"."assistant_usage_limits" add constraint "assistant_usage_limits_pkey" PRIMARY KEY using index "assistant_usage_limits_pkey";

alter table "assistants"."assistants" add constraint "assistants_pkey" PRIMARY KEY using index "assistants_pkey";

alter table "assistants"."assistant_configs" add constraint "assistant_configs_pinecone_name_key" UNIQUE using index "assistant_configs_pinecone_name_key";

alter table "assistants"."assistant_settings" add constraint "assistant_settings_pinecone_name_key" UNIQUE using index "assistant_settings_pinecone_name_key";

alter table "assistants"."assistant_subscriptions" add constraint "assistant_subscriptions_assistant_id_key" UNIQUE using index "assistant_subscriptions_assistant_id_key";

alter table "assistants"."assistant_subscriptions" add constraint "assistant_subscriptions_stripe_subscription_id_key" UNIQUE using index "assistant_subscriptions_stripe_subscription_id_key";

alter table "assistants"."assistants" add constraint "assistants_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users.users(id) not valid;

alter table "assistants"."assistants" validate constraint "assistants_user_id_fkey";

create or replace view "assistants"."assistant_detail_view" as  SELECT a.id,
    a.name,
    a.user_id,
    a.created_at,
    a.updated_at,
    a.pending,
    a.is_starred,
    a.assigned_phone_number,
    ac.description,
    ac.business_name,
    ac.concierge_name,
    ac.concierge_personality,
    ac.system_prompt,
    ac.pinecone_name,
    ac.email,
    ac.website,
    ac.business_phone,
    ac.address,
    ac.share_phone_number,
    aci.email AS contact_email,
    aci.business_phone AS contact_phone,
    aci.website AS contact_website,
    aci.address AS contact_address,
    aci.share_phone_number AS contact_share_phone,
    as2.description AS setting_description,
    as2.business_name AS setting_business_name,
    as2.personality,
    as2.system_prompt AS setting_system_prompt,
    as2.pinecone_name AS setting_pinecone_name,
    aa.last_message_at,
    aa.total_messages,
    aa.last_used_at,
    aa.total_tokens,
    aul.document_limit,
    aul.message_limit,
    aul.token_limit,
    aul.webpage_limit
   FROM (((((assistants.assistants a
     LEFT JOIN assistants.assistant_configs ac ON ((a.id = ac.id)))
     LEFT JOIN assistants.assistant_settings as2 ON ((a.id = as2.assistant_id)))
     LEFT JOIN assistants.assistant_contact_info aci ON ((a.id = aci.assistant_id)))
     LEFT JOIN assistants.assistant_activity aa ON ((a.id = aa.assistant_id)))
     LEFT JOIN assistants.assistant_usage_limits aul ON ((a.id = aul.assistant_id)));


grant delete on table "assistants"."assistant_activity" to "anon";

grant insert on table "assistants"."assistant_activity" to "anon";

grant references on table "assistants"."assistant_activity" to "anon";

grant select on table "assistants"."assistant_activity" to "anon";

grant trigger on table "assistants"."assistant_activity" to "anon";

grant truncate on table "assistants"."assistant_activity" to "anon";

grant update on table "assistants"."assistant_activity" to "anon";

grant delete on table "assistants"."assistant_activity" to "authenticated";

grant insert on table "assistants"."assistant_activity" to "authenticated";

grant references on table "assistants"."assistant_activity" to "authenticated";

grant select on table "assistants"."assistant_activity" to "authenticated";

grant trigger on table "assistants"."assistant_activity" to "authenticated";

grant truncate on table "assistants"."assistant_activity" to "authenticated";

grant update on table "assistants"."assistant_activity" to "authenticated";

grant delete on table "assistants"."assistant_activity" to "service_role";

grant insert on table "assistants"."assistant_activity" to "service_role";

grant references on table "assistants"."assistant_activity" to "service_role";

grant select on table "assistants"."assistant_activity" to "service_role";

grant trigger on table "assistants"."assistant_activity" to "service_role";

grant truncate on table "assistants"."assistant_activity" to "service_role";

grant update on table "assistants"."assistant_activity" to "service_role";

grant delete on table "assistants"."assistant_configs" to "anon";

grant insert on table "assistants"."assistant_configs" to "anon";

grant references on table "assistants"."assistant_configs" to "anon";

grant select on table "assistants"."assistant_configs" to "anon";

grant trigger on table "assistants"."assistant_configs" to "anon";

grant truncate on table "assistants"."assistant_configs" to "anon";

grant update on table "assistants"."assistant_configs" to "anon";

grant delete on table "assistants"."assistant_configs" to "authenticated";

grant insert on table "assistants"."assistant_configs" to "authenticated";

grant references on table "assistants"."assistant_configs" to "authenticated";

grant select on table "assistants"."assistant_configs" to "authenticated";

grant trigger on table "assistants"."assistant_configs" to "authenticated";

grant truncate on table "assistants"."assistant_configs" to "authenticated";

grant update on table "assistants"."assistant_configs" to "authenticated";

grant delete on table "assistants"."assistant_configs" to "service_role";

grant insert on table "assistants"."assistant_configs" to "service_role";

grant references on table "assistants"."assistant_configs" to "service_role";

grant select on table "assistants"."assistant_configs" to "service_role";

grant trigger on table "assistants"."assistant_configs" to "service_role";

grant truncate on table "assistants"."assistant_configs" to "service_role";

grant update on table "assistants"."assistant_configs" to "service_role";

grant delete on table "assistants"."assistant_contact_info" to "anon";

grant insert on table "assistants"."assistant_contact_info" to "anon";

grant references on table "assistants"."assistant_contact_info" to "anon";

grant select on table "assistants"."assistant_contact_info" to "anon";

grant trigger on table "assistants"."assistant_contact_info" to "anon";

grant truncate on table "assistants"."assistant_contact_info" to "anon";

grant update on table "assistants"."assistant_contact_info" to "anon";

grant delete on table "assistants"."assistant_contact_info" to "authenticated";

grant insert on table "assistants"."assistant_contact_info" to "authenticated";

grant references on table "assistants"."assistant_contact_info" to "authenticated";

grant select on table "assistants"."assistant_contact_info" to "authenticated";

grant trigger on table "assistants"."assistant_contact_info" to "authenticated";

grant truncate on table "assistants"."assistant_contact_info" to "authenticated";

grant update on table "assistants"."assistant_contact_info" to "authenticated";

grant delete on table "assistants"."assistant_contact_info" to "service_role";

grant insert on table "assistants"."assistant_contact_info" to "service_role";

grant references on table "assistants"."assistant_contact_info" to "service_role";

grant select on table "assistants"."assistant_contact_info" to "service_role";

grant trigger on table "assistants"."assistant_contact_info" to "service_role";

grant truncate on table "assistants"."assistant_contact_info" to "service_role";

grant update on table "assistants"."assistant_contact_info" to "service_role";

grant delete on table "assistants"."assistant_settings" to "anon";

grant insert on table "assistants"."assistant_settings" to "anon";

grant references on table "assistants"."assistant_settings" to "anon";

grant select on table "assistants"."assistant_settings" to "anon";

grant trigger on table "assistants"."assistant_settings" to "anon";

grant truncate on table "assistants"."assistant_settings" to "anon";

grant update on table "assistants"."assistant_settings" to "anon";

grant delete on table "assistants"."assistant_settings" to "authenticated";

grant insert on table "assistants"."assistant_settings" to "authenticated";

grant references on table "assistants"."assistant_settings" to "authenticated";

grant select on table "assistants"."assistant_settings" to "authenticated";

grant trigger on table "assistants"."assistant_settings" to "authenticated";

grant truncate on table "assistants"."assistant_settings" to "authenticated";

grant update on table "assistants"."assistant_settings" to "authenticated";

grant delete on table "assistants"."assistant_settings" to "service_role";

grant insert on table "assistants"."assistant_settings" to "service_role";

grant references on table "assistants"."assistant_settings" to "service_role";

grant select on table "assistants"."assistant_settings" to "service_role";

grant trigger on table "assistants"."assistant_settings" to "service_role";

grant truncate on table "assistants"."assistant_settings" to "service_role";

grant update on table "assistants"."assistant_settings" to "service_role";

grant delete on table "assistants"."assistant_subscriptions" to "anon";

grant insert on table "assistants"."assistant_subscriptions" to "anon";

grant references on table "assistants"."assistant_subscriptions" to "anon";

grant select on table "assistants"."assistant_subscriptions" to "anon";

grant trigger on table "assistants"."assistant_subscriptions" to "anon";

grant truncate on table "assistants"."assistant_subscriptions" to "anon";

grant update on table "assistants"."assistant_subscriptions" to "anon";

grant delete on table "assistants"."assistant_subscriptions" to "authenticated";

grant insert on table "assistants"."assistant_subscriptions" to "authenticated";

grant references on table "assistants"."assistant_subscriptions" to "authenticated";

grant select on table "assistants"."assistant_subscriptions" to "authenticated";

grant trigger on table "assistants"."assistant_subscriptions" to "authenticated";

grant truncate on table "assistants"."assistant_subscriptions" to "authenticated";

grant update on table "assistants"."assistant_subscriptions" to "authenticated";

grant delete on table "assistants"."assistant_subscriptions" to "service_role";

grant insert on table "assistants"."assistant_subscriptions" to "service_role";

grant references on table "assistants"."assistant_subscriptions" to "service_role";

grant select on table "assistants"."assistant_subscriptions" to "service_role";

grant trigger on table "assistants"."assistant_subscriptions" to "service_role";

grant truncate on table "assistants"."assistant_subscriptions" to "service_role";

grant update on table "assistants"."assistant_subscriptions" to "service_role";

grant delete on table "assistants"."assistant_usage_limits" to "anon";

grant insert on table "assistants"."assistant_usage_limits" to "anon";

grant references on table "assistants"."assistant_usage_limits" to "anon";

grant select on table "assistants"."assistant_usage_limits" to "anon";

grant trigger on table "assistants"."assistant_usage_limits" to "anon";

grant truncate on table "assistants"."assistant_usage_limits" to "anon";

grant update on table "assistants"."assistant_usage_limits" to "anon";

grant delete on table "assistants"."assistant_usage_limits" to "authenticated";

grant insert on table "assistants"."assistant_usage_limits" to "authenticated";

grant references on table "assistants"."assistant_usage_limits" to "authenticated";

grant select on table "assistants"."assistant_usage_limits" to "authenticated";

grant trigger on table "assistants"."assistant_usage_limits" to "authenticated";

grant truncate on table "assistants"."assistant_usage_limits" to "authenticated";

grant update on table "assistants"."assistant_usage_limits" to "authenticated";

grant delete on table "assistants"."assistant_usage_limits" to "service_role";

grant insert on table "assistants"."assistant_usage_limits" to "service_role";

grant references on table "assistants"."assistant_usage_limits" to "service_role";

grant select on table "assistants"."assistant_usage_limits" to "service_role";

grant trigger on table "assistants"."assistant_usage_limits" to "service_role";

grant truncate on table "assistants"."assistant_usage_limits" to "service_role";

grant update on table "assistants"."assistant_usage_limits" to "service_role";

grant delete on table "assistants"."assistants" to "anon";

grant insert on table "assistants"."assistants" to "anon";

grant references on table "assistants"."assistants" to "anon";

grant select on table "assistants"."assistants" to "anon";

grant trigger on table "assistants"."assistants" to "anon";

grant truncate on table "assistants"."assistants" to "anon";

grant update on table "assistants"."assistants" to "anon";

grant delete on table "assistants"."assistants" to "authenticated";

grant insert on table "assistants"."assistants" to "authenticated";

grant references on table "assistants"."assistants" to "authenticated";

grant select on table "assistants"."assistants" to "authenticated";

grant trigger on table "assistants"."assistants" to "authenticated";

grant truncate on table "assistants"."assistants" to "authenticated";

grant update on table "assistants"."assistants" to "authenticated";

grant delete on table "assistants"."assistants" to "service_role";

grant insert on table "assistants"."assistants" to "service_role";

grant references on table "assistants"."assistants" to "service_role";

grant select on table "assistants"."assistants" to "service_role";

grant trigger on table "assistants"."assistants" to "service_role";

grant truncate on table "assistants"."assistants" to "service_role";

grant update on table "assistants"."assistants" to "service_role";

create policy "assistant_activity_admin_select_policy"
on "assistants"."assistant_activity"
as permissive
for select
to authenticated
using (auth.is_admin());


create policy "assistant_activity_owner_policy"
on "assistants"."assistant_activity"
as permissive
for all
to authenticated
using (auth.owns_assistant(assistant_id));


create policy "assistant_configs_admin_select_policy"
on "assistants"."assistant_configs"
as permissive
for select
to authenticated
using (auth.is_admin());


create policy "assistant_configs_owner_policy"
on "assistants"."assistant_configs"
as permissive
for all
to authenticated
using (auth.owns_assistant(id));


create policy "assistant_contact_info_admin_select_policy"
on "assistants"."assistant_contact_info"
as permissive
for select
to authenticated
using (auth.is_admin());


create policy "assistant_contact_info_owner_policy"
on "assistants"."assistant_contact_info"
as permissive
for all
to authenticated
using (auth.owns_assistant(assistant_id));


create policy "assistant_settings_admin_select_policy"
on "assistants"."assistant_settings"
as permissive
for select
to authenticated
using (auth.is_admin());


create policy "assistant_settings_owner_policy"
on "assistants"."assistant_settings"
as permissive
for all
to authenticated
using (auth.owns_assistant(assistant_id));


create policy "assistant_subscriptions_admin_policy"
on "assistants"."assistant_subscriptions"
as permissive
for all
to authenticated
using (auth.is_admin());


create policy "assistant_subscriptions_owner_insert_policy"
on "assistants"."assistant_subscriptions"
as permissive
for insert
to authenticated
with check (auth.owns_assistant(assistant_id));


create policy "assistant_subscriptions_owner_select_policy"
on "assistants"."assistant_subscriptions"
as permissive
for select
to authenticated
using (auth.owns_assistant(assistant_id));


create policy "assistant_subscriptions_owner_update_policy"
on "assistants"."assistant_subscriptions"
as permissive
for update
to authenticated
using (auth.owns_assistant(assistant_id));


create policy "assistant_usage_limits_admin_policy"
on "assistants"."assistant_usage_limits"
as permissive
for all
to authenticated
using (auth.is_admin());


create policy "assistant_usage_limits_owner_select_policy"
on "assistants"."assistant_usage_limits"
as permissive
for select
to authenticated
using (auth.owns_assistant(assistant_id));


create policy "assistants_admin_select_policy"
on "assistants"."assistants"
as permissive
for select
to authenticated
using (auth.is_admin());


create policy "assistants_owner_policy"
on "assistants"."assistants"
as permissive
for all
to authenticated
using ((user_id = auth.get_user_id()));



create type "public"."country" as enum ('US', 'Canada');

create type "public"."monthly_interval" as enum ('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December');

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

create table "public"."phone_numbers" (
    "id" uuid not null default gen_random_uuid(),
    "phone_number" text not null,
    "assistant_id" uuid,
    "country" text,
    "status" text default 'available'::text,
    "is_assigned" boolean default false,
    "capabilities" jsonb default '{"mms": false, "sms": true, "voice": true}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."phone_numbers" enable row level security;

create table "public"."subscription_plans" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "price" numeric(10,2) not null,
    "max_messages" integer default 100,
    "max_tokens" integer default 100000,
    "max_documents" integer default 5,
    "max_webpages" integer default 5,
    "is_active" boolean default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."subscription_plans" enable row level security;

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

CREATE INDEX audit_logs_entity_action_idx ON public.audit_logs USING btree (entity_type, entity_id, action_timestamp DESC);

CREATE INDEX audit_logs_performer_idx ON public.audit_logs USING btree (performed_by, action_timestamp DESC);

CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id);

CREATE INDEX idx_phone_numbers_is_assigned ON public.phone_numbers USING btree (is_assigned);

CREATE INDEX idx_phone_numbers_phone_number ON public.phone_numbers USING btree (phone_number);

CREATE INDEX idx_phone_numbers_status ON public.phone_numbers USING btree (status);

CREATE INDEX idx_phone_numbers_unassigned ON public.phone_numbers USING btree (id, created_at) WHERE (is_assigned = false);

CREATE INDEX idx_subscription_plans_active ON public.subscription_plans USING btree (id) WHERE (is_active = true);

CREATE INDEX idx_usage_statistics_entity ON public.usage_statistics USING btree (entity_id, entity_type);

CREATE INDEX idx_usage_statistics_entity_type_entity_id ON public.usage_statistics USING btree (entity_type, entity_id);

CREATE INDEX idx_usage_statistics_period ON public.usage_statistics USING btree (period);

CREATE INDEX idx_usage_statistics_period_entity_type ON public.usage_statistics USING btree (period, entity_type);

CREATE INDEX phone_numbers_assistant_id_idx ON public.phone_numbers USING btree (assistant_id);

CREATE UNIQUE INDEX phone_numbers_phone_number_key ON public.phone_numbers USING btree (phone_number);

CREATE UNIQUE INDEX phone_numbers_pkey ON public.phone_numbers USING btree (id);

CREATE UNIQUE INDEX subscription_plans_name_key ON public.subscription_plans USING btree (name);

CREATE UNIQUE INDEX subscription_plans_pkey ON public.subscription_plans USING btree (id);

CREATE INDEX usage_statistics_entity_period_idx ON public.usage_statistics USING btree (entity_type, entity_id, period);

CREATE UNIQUE INDEX usage_statistics_entity_period_unique ON public.usage_statistics USING btree (entity_id, entity_type, period);

CREATE UNIQUE INDEX usage_statistics_pkey ON public.usage_statistics USING btree (id);

alter table "public"."audit_logs" add constraint "audit_logs_pkey" PRIMARY KEY using index "audit_logs_pkey";

alter table "public"."phone_numbers" add constraint "phone_numbers_pkey" PRIMARY KEY using index "phone_numbers_pkey";

alter table "public"."subscription_plans" add constraint "subscription_plans_pkey" PRIMARY KEY using index "subscription_plans_pkey";

alter table "public"."usage_statistics" add constraint "usage_statistics_pkey" PRIMARY KEY using index "usage_statistics_pkey";

alter table "public"."phone_numbers" add constraint "phone_numbers_assistant_id_fkey" FOREIGN KEY (assistant_id) REFERENCES assistants.assistants(id) ON DELETE SET NULL not valid;

alter table "public"."phone_numbers" validate constraint "phone_numbers_assistant_id_fkey";

alter table "public"."phone_numbers" add constraint "phone_numbers_phone_number_key" UNIQUE using index "phone_numbers_phone_number_key";

alter table "public"."subscription_plans" add constraint "subscription_plans_name_key" UNIQUE using index "subscription_plans_name_key";

alter table "public"."usage_statistics" add constraint "usage_statistics_entity_period_unique" UNIQUE using index "usage_statistics_entity_period_unique";

alter table "public"."usage_statistics" add constraint "usage_statistics_entity_type_check" CHECK ((entity_type = ANY (ARRAY['assistant'::text, 'user'::text]))) not valid;

alter table "public"."usage_statistics" validate constraint "usage_statistics_entity_type_check";

set check_function_bodies = off;

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

CREATE OR REPLACE FUNCTION public.create_unpaid_assistant(p_user_id text, p_name text, p_description text DEFAULT NULL::text, p_personality text DEFAULT 'Business Casual'::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_assistant_id TEXT;
BEGIN
  -- Generate a unique ID for the assistant
  v_assistant_id := gen_random_uuid()::TEXT;
  
  -- Insert into assistants table
  INSERT INTO assistants (
    id,
    name,
    user_id,
    created_at,
    updated_at,
    pending,
    is_starred
  ) VALUES (
    v_assistant_id,
    p_name,
    p_user_id,
    NOW(),
    NOW(),
    false,
    false
  );

  -- Insert into assistant_configs
  INSERT INTO assistant_configs (
    id,
    description,
    concierge_personality,
    created_at,
    updated_at
  ) VALUES (
    v_assistant_id,
    p_description,
    p_personality,
    NOW(),
    NOW()
  );

  -- Insert default usage limits for unpaid tier
  INSERT INTO assistant_usage_limits (
    assistant_id,
    message_limit,
    token_limit,
    document_limit,
    webpage_limit,
    created_at,
    updated_at
  ) VALUES (
    v_assistant_id,
    100,  -- Default message limit for unpaid
    50000,  -- Default token limit for unpaid
    5,    -- Default document limit for unpaid
    10,   -- Default webpage limit for unpaid
    NOW(),
    NOW()
  );

  -- Initialize activity tracking
  INSERT INTO assistant_activity (
    assistant_id,
    total_messages,
    total_tokens,
    total_documents,
    total_webpages,
    created_at,
    updated_at
  ) VALUES (
    v_assistant_id,
    0,
    0,
    0,
    0,
    NOW(),
    NOW()
  );

  RETURN v_assistant_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.interactions_insert_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.manage_admin_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  auth_uid UUID;
BEGIN
  -- Get auth.uid from auth.users table based on auth_user_id
  SELECT id INTO auth_uid 
  FROM auth.users 
  WHERE id = NEW.auth_user_id;

  IF auth_uid IS NULL THEN
    RAISE EXCEPTION 'User not found in auth.users with id %', NEW.auth_user_id;
  END IF;

  -- If is_admin flag is true and it has changed (or this is an insert), grant admin role
  IF NEW.is_admin = true AND (TG_OP = 'INSERT' OR OLD.is_admin IS DISTINCT FROM NEW.is_admin) THEN
    -- Grant the admin_role to the user
    EXECUTE format('GRANT admin_role TO auth_uid_%s', auth_uid);
    
    -- Log the admin role assignment
    INSERT INTO public.audit_logs (
      entity_id, 
      entity_type, 
      action, 
      action_timestamp, 
      performed_by, 
      details
    ) VALUES (
      NEW.id,
      'user',
      'admin_role_assigned',
      now(),
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
      jsonb_build_object('user_id', NEW.id, 'auth_user_id', NEW.auth_user_id)
    ) ON CONFLICT DO NOTHING;
    
  -- If is_admin flag is false and it has changed, revoke admin role
  ELSIF NEW.is_admin = false AND (TG_OP = 'UPDATE' AND OLD.is_admin IS DISTINCT FROM NEW.is_admin) THEN
    -- Revoke the admin_role from the user
    EXECUTE format('REVOKE admin_role FROM auth_uid_%s', auth_uid);
    
    -- Log the admin role revocation
    INSERT INTO public.audit_logs (
      entity_id, 
      entity_type, 
      action, 
      action_timestamp, 
      performed_by, 
      details
    ) VALUES (
      NEW.id,
      'user',
      'admin_role_revoked',
      now(),
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
      jsonb_build_object('user_id', NEW.id, 'auth_user_id', NEW.auth_user_id)
    ) ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't prevent user creation/update
    RAISE WARNING 'Error managing admin role: %', SQLERRM;
    RETURN NEW;
END;
$function$
;

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

grant delete on table "public"."phone_numbers" to "admin_role";

grant insert on table "public"."phone_numbers" to "admin_role";

grant select on table "public"."phone_numbers" to "admin_role";

grant update on table "public"."phone_numbers" to "admin_role";

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

grant delete on table "public"."subscription_plans" to "admin_role";

grant insert on table "public"."subscription_plans" to "admin_role";

grant select on table "public"."subscription_plans" to "admin_role";

grant update on table "public"."subscription_plans" to "admin_role";

grant delete on table "public"."subscription_plans" to "anon";

grant insert on table "public"."subscription_plans" to "anon";

grant references on table "public"."subscription_plans" to "anon";

grant select on table "public"."subscription_plans" to "anon";

grant trigger on table "public"."subscription_plans" to "anon";

grant truncate on table "public"."subscription_plans" to "anon";

grant update on table "public"."subscription_plans" to "anon";

grant delete on table "public"."subscription_plans" to "authenticated";

grant insert on table "public"."subscription_plans" to "authenticated";

grant references on table "public"."subscription_plans" to "authenticated";

grant select on table "public"."subscription_plans" to "authenticated";

grant trigger on table "public"."subscription_plans" to "authenticated";

grant truncate on table "public"."subscription_plans" to "authenticated";

grant update on table "public"."subscription_plans" to "authenticated";

grant delete on table "public"."subscription_plans" to "service_role";

grant insert on table "public"."subscription_plans" to "service_role";

grant references on table "public"."subscription_plans" to "service_role";

grant select on table "public"."subscription_plans" to "service_role";

grant trigger on table "public"."subscription_plans" to "service_role";

grant truncate on table "public"."subscription_plans" to "service_role";

grant update on table "public"."subscription_plans" to "service_role";

grant delete on table "public"."usage_statistics" to "admin_role";

grant insert on table "public"."usage_statistics" to "admin_role";

grant select on table "public"."usage_statistics" to "admin_role";

grant update on table "public"."usage_statistics" to "admin_role";

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

create policy "audit_logs_admin_policy"
on "public"."audit_logs"
as permissive
for all
to admin_role
using (true);


create policy "audit_logs_self_select_policy"
on "public"."audit_logs"
as permissive
for select
to authenticated
using ((performed_by = auth.uid()));


create policy "audit_logs_user_select_policy"
on "public"."audit_logs"
as permissive
for select
to authenticated
using (((performed_by = auth.uid()) OR (entity_id IN ( SELECT audit_logs.id
   FROM users.customer_profiles
  WHERE (customer_profiles.user_id = auth.uid()))) OR (entity_id IN ( SELECT assistants.id
   FROM assistants.assistants
  WHERE (assistants.user_id = auth.uid())))));


create policy "phone_numbers_admin_policy"
on "public"."phone_numbers"
as permissive
for all
to admin_role
using (true);


create policy "phone_numbers_owner_select_policy"
on "public"."phone_numbers"
as permissive
for select
to authenticated
using (((assistant_id IS NULL) OR auth.owns_assistant(assistant_id)));


create policy "phone_numbers_user_select_policy"
on "public"."phone_numbers"
as permissive
for select
to authenticated
using (((assistant_id IN ( SELECT assistants.id
   FROM assistants.assistants
  WHERE (assistants.user_id = auth.uid()))) OR ((assistant_id IS NULL) AND (is_assigned = false))));


create policy "phone_numbers_user_update_policy"
on "public"."phone_numbers"
as permissive
for update
to authenticated
using ((assistant_id IN ( SELECT assistants.id
   FROM assistants.assistants
  WHERE (assistants.user_id = auth.uid()))))
with check ((assistant_id IN ( SELECT assistants.id
   FROM assistants.assistants
  WHERE (assistants.user_id = auth.uid()))));


create policy "subscription_plans_admin_policy"
on "public"."subscription_plans"
as permissive
for all
to admin_role
using (true);


create policy "subscription_plans_anon_select_policy"
on "public"."subscription_plans"
as permissive
for select
to anon
using ((is_active = true));


create policy "subscription_plans_select_policy"
on "public"."subscription_plans"
as permissive
for select
to authenticated
using ((is_active = true));


create policy "usage_statistics_admin_policy"
on "public"."usage_statistics"
as permissive
for all
to authenticated
using (auth.is_admin());


create policy "usage_statistics_owner_select_policy"
on "public"."usage_statistics"
as permissive
for select
to authenticated
using ((((entity_type = 'user'::text) AND (entity_id = auth.get_user_id())) OR ((entity_type = 'assistant'::text) AND auth.owns_assistant(entity_id))));



create schema if not exists "users";

create table "users"."customer_profiles" (
    "user_id" uuid not null,
    "stripe_customer_id" text,
    "full_name" text,
    "company" text,
    "preferred_payment_method" text,
    "country" text,
    "timezone" text,
    "onboarding_completed" boolean default false,
    "feature_flags" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "users"."customer_profiles" enable row level security;

create table "users"."users" (
    "id" uuid not null default gen_random_uuid(),
    "auth_user_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "is_admin" boolean default false,
    "last_active" timestamp with time zone
);


alter table "users"."users" enable row level security;

CREATE UNIQUE INDEX customer_profiles_pkey ON users.customer_profiles USING btree (user_id);

CREATE UNIQUE INDEX customer_profiles_stripe_customer_id_key ON users.customer_profiles USING btree (stripe_customer_id);

CREATE INDEX idx_users_auth_user_id ON users.users USING btree (auth_user_id);

CREATE INDEX idx_users_is_admin ON users.users USING btree (is_admin) WHERE (is_admin = true);

CREATE INDEX idx_users_last_active ON users.users USING btree (last_active DESC);

CREATE UNIQUE INDEX users_auth_user_id_key ON users.users USING btree (auth_user_id);

CREATE UNIQUE INDEX users_pkey ON users.users USING btree (id);

alter table "users"."customer_profiles" add constraint "customer_profiles_pkey" PRIMARY KEY using index "customer_profiles_pkey";

alter table "users"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "users"."customer_profiles" add constraint "customer_profiles_stripe_customer_id_key" UNIQUE using index "customer_profiles_stripe_customer_id_key";

alter table "users"."customer_profiles" add constraint "customer_profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users.users(id) ON DELETE CASCADE not valid;

alter table "users"."customer_profiles" validate constraint "customer_profiles_user_id_fkey";

alter table "users"."users" add constraint "users_auth_user_id_key" UNIQUE using index "users_auth_user_id_key";

grant delete on table "users"."customer_profiles" to "admin_role";

grant insert on table "users"."customer_profiles" to "admin_role";

grant select on table "users"."customer_profiles" to "admin_role";

grant update on table "users"."customer_profiles" to "admin_role";

grant delete on table "users"."customer_profiles" to "anon";

grant insert on table "users"."customer_profiles" to "anon";

grant references on table "users"."customer_profiles" to "anon";

grant select on table "users"."customer_profiles" to "anon";

grant trigger on table "users"."customer_profiles" to "anon";

grant truncate on table "users"."customer_profiles" to "anon";

grant update on table "users"."customer_profiles" to "anon";

grant delete on table "users"."customer_profiles" to "authenticated";

grant insert on table "users"."customer_profiles" to "authenticated";

grant references on table "users"."customer_profiles" to "authenticated";

grant select on table "users"."customer_profiles" to "authenticated";

grant trigger on table "users"."customer_profiles" to "authenticated";

grant truncate on table "users"."customer_profiles" to "authenticated";

grant update on table "users"."customer_profiles" to "authenticated";

grant delete on table "users"."customer_profiles" to "service_role";

grant insert on table "users"."customer_profiles" to "service_role";

grant references on table "users"."customer_profiles" to "service_role";

grant select on table "users"."customer_profiles" to "service_role";

grant trigger on table "users"."customer_profiles" to "service_role";

grant truncate on table "users"."customer_profiles" to "service_role";

grant update on table "users"."customer_profiles" to "service_role";

grant delete on table "users"."users" to "admin_role";

grant insert on table "users"."users" to "admin_role";

grant select on table "users"."users" to "admin_role";

grant update on table "users"."users" to "admin_role";

grant delete on table "users"."users" to "anon";

grant insert on table "users"."users" to "anon";

grant references on table "users"."users" to "anon";

grant select on table "users"."users" to "anon";

grant trigger on table "users"."users" to "anon";

grant truncate on table "users"."users" to "anon";

grant update on table "users"."users" to "anon";

grant delete on table "users"."users" to "authenticated";

grant insert on table "users"."users" to "authenticated";

grant references on table "users"."users" to "authenticated";

grant select on table "users"."users" to "authenticated";

grant trigger on table "users"."users" to "authenticated";

grant truncate on table "users"."users" to "authenticated";

grant update on table "users"."users" to "authenticated";

grant delete on table "users"."users" to "service_role";

grant insert on table "users"."users" to "service_role";

grant references on table "users"."users" to "service_role";

grant select on table "users"."users" to "service_role";

grant trigger on table "users"."users" to "service_role";

grant truncate on table "users"."users" to "service_role";

grant update on table "users"."users" to "service_role";

create policy "customer_profiles_admin_select_policy"
on "users"."customer_profiles"
as permissive
for select
to authenticated
using (auth.is_admin());


create policy "customer_profiles_owner_policy"
on "users"."customer_profiles"
as permissive
for all
to authenticated
using ((user_id = auth.get_user_id()));


create policy "users_admin_select_policy"
on "users"."users"
as permissive
for select
to authenticated
using (auth.is_admin());


create policy "users_admin_update_policy"
on "users"."users"
as permissive
for update
to authenticated
using (auth.is_admin());


create policy "users_self_policy"
on "users"."users"
as permissive
for select
to authenticated
using ((auth_user_id = auth.uid()));


create policy "users_self_update_policy"
on "users"."users"
as permissive
for update
to authenticated
using ((auth_user_id = auth.uid()))
with check (((is_admin = false) OR auth.is_admin()));


CREATE TRIGGER manage_admin_role_trigger AFTER INSERT OR UPDATE OF is_admin ON users.users FOR EACH ROW EXECUTE FUNCTION manage_admin_role();


