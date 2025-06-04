-- Create optimized payment_sessions table that references assistant_configs instead of duplicating data
CREATE TABLE IF NOT EXISTS public.payment_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE, -- Unique identifier for each purchase attempt
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Store assistant config data as JSONB (snapshot at time of purchase)
  assistant_config_data JSONB NOT NULL,

  -- Payment and subscription info
  stripe_checkout_session_id TEXT,
  stripe_customer_id TEXT,
  plan_id TEXT,
  amount_total INTEGER,
  currency TEXT DEFAULT 'usd',
  customer_email TEXT,

  -- Session status
  status TEXT NOT NULL DEFAULT 'pending',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT payment_sessions_status_check CHECK (status IN ('pending', 'completed', 'expired', 'cancelled'))
);

-- Add payment_session_id to assistant_subscriptions to link purchases
ALTER TABLE public.assistant_subscriptions
ADD COLUMN IF NOT EXISTS payment_session_id UUID REFERENCES public.payment_sessions(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_sessions_session_id ON public.payment_sessions (session_id);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_user_id ON public.payment_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_status ON public.payment_sessions (status);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_created_at ON public.payment_sessions (created_at);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_expires_at ON public.payment_sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_assistant_subscriptions_payment_session ON public.assistant_subscriptions (payment_session_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.payment_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_sessions
CREATE POLICY "Users can view their own payment sessions" ON public.payment_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment sessions" ON public.payment_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment sessions" ON public.payment_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all payment sessions" ON public.payment_sessions
  FOR ALL USING (true);

-- Add updated_at trigger for payment_sessions
CREATE OR REPLACE FUNCTION update_payment_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payment_sessions_updated_at
  BEFORE UPDATE ON public.payment_sessions
  FOR EACH ROW EXECUTE FUNCTION update_payment_sessions_updated_at();