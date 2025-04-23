-- Create pending assistants table to store assistant data before payment
CREATE TABLE IF NOT EXISTS pending_assistants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  params JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  checkout_session_id TEXT,
  plan_id TEXT
);

-- Add index for user lookups
CREATE INDEX IF NOT EXISTS pending_assistants_user_id_idx ON pending_assistants(user_id);

-- Add index for checkout session lookups 
CREATE INDEX IF NOT EXISTS pending_assistants_checkout_idx ON pending_assistants(checkout_session_id);