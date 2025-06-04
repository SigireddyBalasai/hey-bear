-- Add missing fields to assistant_configs table
-- These fields are needed for the AssistantData interface in the webhook and payment flows

-- Add concierge_name field to store the concierge/assistant display name
ALTER TABLE "public"."assistant_configs" 
ADD COLUMN IF NOT EXISTS "concierge_name" text;

-- Add share_phone_number field to store whether the assistant should share its phone number
ALTER TABLE "public"."assistant_configs" 
ADD COLUMN IF NOT EXISTS "share_phone_number" boolean DEFAULT false;

-- Add comments for the new fields
COMMENT ON COLUMN "public"."assistant_configs"."concierge_name" IS 'Display name for the concierge assistant, used in conversations and interactions.';

COMMENT ON COLUMN "public"."assistant_configs"."share_phone_number" IS 'Boolean flag indicating whether the assistant should share its phone number with users.';