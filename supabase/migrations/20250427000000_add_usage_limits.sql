-- Create a table to track usage limits for each assistant
CREATE TABLE IF NOT EXISTS usage_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assistant_id UUID NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
    
    -- Message counters
    messages_received INT DEFAULT 0 NOT NULL,
    messages_sent INT DEFAULT 0 NOT NULL,
    
    -- Document counters
    documents_count INT DEFAULT 0 NOT NULL,
    
    -- Webpage counters
    webpages_crawled INT DEFAULT 0 NOT NULL,
    
    -- Monthly reset tracking
    last_reset TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    CONSTRAINT unique_assistant_usage UNIQUE (assistant_id)
);

-- Add function to update the usage_limits.updated_at when a row is modified
CREATE OR REPLACE FUNCTION update_usage_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically update updated_at timestamp
CREATE TRIGGER update_usage_limits_updated_at
BEFORE UPDATE ON usage_limits
FOR EACH ROW
EXECUTE PROCEDURE update_usage_limits_updated_at();

-- Add RLS policies
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select their own usage data
CREATE POLICY select_usage_limits ON usage_limits
FOR SELECT
USING (
    assistant_id IN (
        SELECT id FROM assistants WHERE user_id = auth.uid()
    )
);

-- Policy to allow admin users to select any usage data
CREATE POLICY select_usage_limits_admin ON usage_limits
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND is_admin = TRUE
    )
);

-- Create an index for faster lookups by assistant_id
CREATE INDEX idx_usage_limits_assistant_id ON usage_limits(assistant_id);

-- Create function to automatically create usage_limits record when a new assistant is created
CREATE OR REPLACE FUNCTION create_usage_limits_for_new_assistant()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO usage_limits (assistant_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically create usage_limits record for new assistants
CREATE TRIGGER create_usage_limits_for_new_assistant
AFTER INSERT ON assistants
FOR EACH ROW
EXECUTE PROCEDURE create_usage_limits_for_new_assistant();

-- Backfill: Create usage_limits records for existing assistants
INSERT INTO usage_limits (assistant_id)
SELECT id FROM assistants
WHERE id NOT IN (SELECT assistant_id FROM usage_limits)
ON CONFLICT (assistant_id) DO NOTHING;