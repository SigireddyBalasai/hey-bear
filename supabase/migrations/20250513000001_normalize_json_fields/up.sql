-- Migration to normalize JSON fields in the database
-- This migration will create new tables to replace the JSON data stored in the assistants.params field

-- Step 1: Create new tables for the normalized data structure

-- Table for assistant configurations
CREATE TABLE IF NOT EXISTS assistant_configs (
    id UUID PRIMARY KEY REFERENCES assistants(id) ON DELETE CASCADE,
    system_prompt TEXT,
    description TEXT,
    concierge_name TEXT,
    concierge_personality TEXT,
    business_name TEXT,
    share_phone_number BOOLEAN DEFAULT false,
    business_phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for subscription details (replacing the nested subscription object in params)
CREATE TABLE IF NOT EXISTS assistant_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assistant_id UUID REFERENCES assistants(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT,
    plan VARCHAR(50) NOT NULL DEFAULT 'personal',
    status VARCHAR(50) NOT NULL DEFAULT 'inactive',
    current_period_end TIMESTAMP WITH TIME ZONE,
    current_period_start TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (assistant_id)
);

-- Table for assistant usage limits
CREATE TABLE IF NOT EXISTS assistant_usage_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assistant_id UUID REFERENCES assistants(id) ON DELETE CASCADE,
    max_messages INTEGER NOT NULL DEFAULT 100,
    max_tokens INTEGER NOT NULL DEFAULT 100000,
    max_documents INTEGER NOT NULL DEFAULT 5,
    max_webpages INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (assistant_id)
);

-- Table for last_used tracking and other stats
CREATE TABLE IF NOT EXISTS assistant_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assistant_id UUID REFERENCES assistants(id) ON DELETE CASCADE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    total_messages INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (assistant_id)
);

-- Step 2: Create a function to migrate data from JSON to the new tables
CREATE OR REPLACE FUNCTION migrate_assistant_params()
RETURNS VOID AS $$
DECLARE
    assistant_record RECORD;
    params_json JSONB;
    subscription_json JSONB;
BEGIN
    FOR assistant_record IN SELECT id, params FROM assistants WHERE params IS NOT NULL LOOP
        params_json := assistant_record.params::JSONB;
        
        -- Insert into assistant_configs
        INSERT INTO assistant_configs (
            id, 
            description, 
            concierge_name,
            concierge_personality,
            business_name,
            share_phone_number,
            business_phone
        ) VALUES (
            assistant_record.id,
            COALESCE(params_json->>'description', NULL),
            COALESCE(params_json->>'conciergeName', NULL),
            COALESCE(params_json->>'conciergePersonality', NULL),
            COALESCE(params_json->>'businessName', NULL),
            COALESCE((params_json->>'sharePhoneNumber')::BOOLEAN, FALSE),
            COALESCE(params_json->>'phoneNumber', NULL)
        ) ON CONFLICT (id) DO NOTHING;
        
        -- Check if subscription data exists
        IF params_json ? 'subscription' THEN
            subscription_json := params_json->'subscription';
            
            -- Insert into assistant_subscriptions
            INSERT INTO assistant_subscriptions (
                assistant_id,
                stripe_subscription_id,
                plan,
                status,
                current_period_end,
                created_at
            ) VALUES (
                assistant_record.id,
                COALESCE(subscription_json->>'stripeSubscriptionId', NULL),
                COALESCE(subscription_json->>'plan', 'personal'),
                COALESCE(subscription_json->>'status', 'inactive'),
                COALESCE((subscription_json->>'currentPeriodEnd')::TIMESTAMP WITH TIME ZONE, NULL),
                COALESCE((subscription_json->>'createdAt')::TIMESTAMP WITH TIME ZONE, CURRENT_TIMESTAMP)
            ) ON CONFLICT (assistant_id) DO NOTHING;
        END IF;
        
        -- Insert default usage limits based on the plan
        INSERT INTO assistant_usage_limits (
            assistant_id,
            max_messages,
            max_tokens,
            max_documents,
            max_webpages
        ) VALUES (
            assistant_record.id,
            CASE 
                WHEN params_json->>'plan' = 'business' THEN 2000
                ELSE 100
            END,
            CASE
                WHEN params_json->>'plan' = 'business' THEN 1000000
                ELSE 100000
            END,
            CASE
                WHEN params_json->>'plan' = 'business' THEN 25
                ELSE 5
            END,
            CASE
                WHEN params_json->>'plan' = 'business' THEN 25
                ELSE 5
            END
        ) ON CONFLICT (assistant_id) DO NOTHING;
        
        -- Track last used info
        IF params_json ? 'last_used_at' THEN
            INSERT INTO assistant_activity (
                assistant_id,
                last_used_at
            ) VALUES (
                assistant_record.id,
                (params_json->>'last_used_at')::TIMESTAMP WITH TIME ZONE
            ) ON CONFLICT (assistant_id) DO NOTHING;
        ELSE 
            INSERT INTO assistant_activity (
                assistant_id
            ) VALUES (
                assistant_record.id
            ) ON CONFLICT (assistant_id) DO NOTHING;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Execute the migration function
SELECT migrate_assistant_params();

-- Step 4: Create stored procedures and functions to replace any that were using the JSON fields

-- Update or replace existing functions that rely on params field
CREATE OR REPLACE FUNCTION get_assistant_subscription_details(p_assistant_id UUID)
RETURNS TABLE (
    subscription_id UUID,
    stripe_subscription_id TEXT,
    plan VARCHAR(50),
    status VARCHAR(50),
    current_period_end TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN,
    days_remaining INTEGER,
    max_messages INTEGER,
    max_tokens INTEGER,
    max_documents INTEGER,
    max_webpages INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id AS subscription_id,
        s.stripe_subscription_id,
        s.plan,
        s.status,
        s.current_period_end,
        (s.status = 'active' OR s.status = 'trialing') AS is_active,
        CASE
            WHEN s.current_period_end IS NULL THEN 0
            ELSE EXTRACT(DAY FROM s.current_period_end - CURRENT_TIMESTAMP)::INTEGER
        END AS days_remaining,
        l.max_messages,
        l.max_tokens,
        l.max_documents,
        l.max_webpages
    FROM 
        assistant_subscriptions s
    LEFT JOIN 
        assistant_usage_limits l ON s.assistant_id = l.assistant_id
    WHERE 
        s.assistant_id = p_assistant_id;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Add triggers to maintain updated_at timestamps

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assistant_configs_timestamp
BEFORE UPDATE ON assistant_configs
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_assistant_subscriptions_timestamp
BEFORE UPDATE ON assistant_subscriptions
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_assistant_usage_limits_timestamp
BEFORE UPDATE ON assistant_usage_limits
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_assistant_activity_timestamp
BEFORE UPDATE ON assistant_activity
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Note: we're not removing the params column yet to ensure backward compatibility
-- In a future migration, once all code has been updated, we can remove the column