-- Rollback the changes made in the up migration
-- This will drop all the new tables and restore the original structure

-- First, drop all triggers
DROP TRIGGER IF EXISTS update_assistant_configs_timestamp ON assistant_configs;
DROP TRIGGER IF EXISTS update_assistant_subscriptions_timestamp ON assistant_subscriptions;
DROP TRIGGER IF EXISTS update_assistant_usage_limits_timestamp ON assistant_usage_limits;
DROP TRIGGER IF EXISTS update_assistant_activity_timestamp ON assistant_activity;

-- Drop the function that was created for triggers
DROP FUNCTION IF EXISTS update_timestamp();

-- Drop the new functions that replaced the old ones
DROP FUNCTION IF EXISTS get_assistant_subscription_details(UUID);

-- Drop the migration function
DROP FUNCTION IF EXISTS migrate_assistant_params();

-- Drop the tables in reverse order (to avoid foreign key constraints)
DROP TABLE IF EXISTS assistant_activity;
DROP TABLE IF EXISTS assistant_usage_limits;
DROP TABLE IF EXISTS assistant_subscriptions;
DROP TABLE IF EXISTS assistant_configs;

-- Note: We didn't remove the params column, so no need to recreate it