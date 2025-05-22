-- Migration: Enhance assistant creation functionality
-- Created: May 22, 2025

-- Update the existing create_unpaid_assistant function to accept all necessary parameters
CREATE OR REPLACE FUNCTION public.create_unpaid_assistant(
  p_user_id TEXT, 
  p_name TEXT, 
  p_description TEXT DEFAULT NULL,
  p_personality TEXT DEFAULT 'Business Casual',
  p_business_name TEXT DEFAULT NULL,
  p_concierge_name TEXT DEFAULT NULL,
  p_share_phone_number BOOLEAN DEFAULT FALSE,
  p_business_phone TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assistant_id TEXT;
  v_system_prompt TEXT;
  v_concierge_name TEXT;
BEGIN
  -- Generate a unique ID for the assistant
  v_assistant_id := gen_random_uuid()::TEXT;
  
  -- Set concierge name to either provided value or default to the assistant name
  v_concierge_name := COALESCE(p_concierge_name, p_name);
  
  -- Generate a system prompt based on parameters
  v_system_prompt := 'You are ' || v_concierge_name;
  
  IF p_business_name IS NOT NULL THEN
    v_system_prompt := v_system_prompt || ', a virtual concierge for ' || p_business_name;
  END IF;
  
  v_system_prompt := v_system_prompt || '. Your personality style is ' || p_personality || '.';
  
  IF p_description IS NOT NULL THEN
    v_system_prompt := v_system_prompt || ' ' || p_description;
  END IF;
  
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
    false,  -- Not pending
    false   -- Not starred
  );

  -- Insert into assistant_configs with complete information
  INSERT INTO assistant_configs (
    id,
    description,
    concierge_personality,
    concierge_name,
    business_name,
    share_phone_number,
    business_phone,
    system_prompt,
    created_at,
    updated_at
  ) VALUES (
    v_assistant_id,
    p_description,
    p_personality,
    v_concierge_name,
    p_business_name,
    p_share_phone_number,
    p_business_phone,
    v_system_prompt,
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
$$;
