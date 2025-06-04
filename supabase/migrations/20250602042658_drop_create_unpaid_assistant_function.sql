-- Drop the create_unpaid_assistant function as it's no longer needed
-- The application now handles assistant creation directly through API routes

DROP FUNCTION IF EXISTS "public"."create_unpaid_assistant"(
    "p_user_id" "uuid",
    "p_name" "text",
    "p_description" "text",
    "p_personality" "text",
    "p_business_name" "text",
    "p_concierge_name" "text",
    "p_share_phone_number" boolean,
    "p_business_phone" "text"
);