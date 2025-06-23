-- Helper function to check if the current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the 'is_admin' custom claim is true in the JWT
  RETURN (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean IS TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- If claim is not present or any other error, not an admin
    RETURN FALSE;
END;
$$;

-- Grant execute on the function to authenticated users
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;


-- =============================================
-- RLS Policies for 'assistants' table
-- =============================================

-- Drop existing policies (adjust names if they differ)
ALTER TABLE public.assistants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own assistants" ON public.assistants;
DROP POLICY IF EXISTS "Users can insert their own assistants" ON public.assistants;
DROP POLICY IF EXISTS "Users can update their own assistants" ON public.assistants;
DROP POLICY IF EXISTS "Users can delete their own assistants" ON public.assistants;

-- Policies for plan_user (non-admin)
CREATE POLICY "plan_users_select_own_assistants" ON public.assistants
FOR SELECT TO authenticated
USING (user_id = auth.uid() AND NOT is_admin());

CREATE POLICY "plan_users_insert_own_assistants" ON public.assistants
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND NOT is_admin());

CREATE POLICY "plan_users_update_own_assistants" ON public.assistants
FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND NOT is_admin())
WITH CHECK (user_id = auth.uid() AND NOT is_admin());

CREATE POLICY "plan_users_delete_own_assistants" ON public.assistants
FOR DELETE TO authenticated
USING (user_id = auth.uid() AND NOT is_admin());

-- Policy for admin_user (read-all)
CREATE POLICY "admin_users_select_all_assistants" ON public.assistants
FOR SELECT TO authenticated
USING (is_admin());

-- =============================================
-- RLS Policies for 'assistant_configs' table
-- =============================================
ALTER TABLE public.assistant_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their assistant configs" ON public.assistant_configs;
DROP POLICY IF EXISTS "Users can insert their assistant configs" ON public.assistant_configs;
DROP POLICY IF EXISTS "Users can update their assistant configs" ON public.assistant_configs;
DROP POLICY IF EXISTS "Users can delete their assistant configs" ON public.assistant_configs;

-- Policies for plan_user (non-admin)
CREATE POLICY "plan_users_select_own_assistant_configs" ON public.assistant_configs
FOR SELECT TO authenticated
USING (id IN (SELECT assistants.id FROM public.assistants WHERE assistants.user_id = auth.uid()) AND NOT is_admin());

CREATE POLICY "plan_users_insert_own_assistant_configs" ON public.assistant_configs
FOR INSERT TO authenticated
WITH CHECK (id IN (SELECT assistants.id FROM public.assistants WHERE assistants.user_id = auth.uid()) AND NOT is_admin());

CREATE POLICY "plan_users_update_own_assistant_configs" ON public.assistant_configs
FOR UPDATE TO authenticated
USING (id IN (SELECT assistants.id FROM public.assistants WHERE assistants.user_id = auth.uid()) AND NOT is_admin())
WITH CHECK (id IN (SELECT assistants.id FROM public.assistants WHERE assistants.user_id = auth.uid()) AND NOT is_admin());

CREATE POLICY "plan_users_delete_own_assistant_configs" ON public.assistant_configs
FOR DELETE TO authenticated
USING (id IN (SELECT assistants.id FROM public.assistants WHERE assistants.user_id = auth.uid()) AND NOT is_admin());

-- Policy for admin_user (read-all)
CREATE POLICY "admin_users_select_all_assistant_configs" ON public.assistant_configs
FOR SELECT TO authenticated
USING (is_admin());


-- =============================================
-- RLS Policies for 'assistant_subscriptions' table
-- =============================================
ALTER TABLE public.assistant_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their assistant subscriptions" ON public.assistant_subscriptions;
DROP POLICY IF EXISTS "Users can insert their assistant subscriptions" ON public.assistant_subscriptions;
DROP POLICY IF EXISTS "Users can update their assistant subscriptions" ON public.assistant_subscriptions;
DROP POLICY IF EXISTS "Users can delete their assistant subscriptions" ON public.assistant_subscriptions;

-- Policies for plan_user (non-admin)
CREATE POLICY "plan_users_select_own_assistant_subscriptions" ON public.assistant_subscriptions
FOR SELECT TO authenticated
USING (assistant_id IN (SELECT assistants.id FROM public.assistants WHERE assistants.user_id = auth.uid()) AND NOT is_admin());

CREATE POLICY "plan_users_insert_own_assistant_subscriptions" ON public.assistant_subscriptions
FOR INSERT TO authenticated
WITH CHECK (assistant_id IN (SELECT assistants.id FROM public.assistants WHERE assistants.user_id = auth.uid()) AND NOT is_admin());

CREATE POLICY "plan_users_update_own_assistant_subscriptions" ON public.assistant_subscriptions
FOR UPDATE TO authenticated
USING (assistant_id IN (SELECT assistants.id FROM public.assistants WHERE assistants.user_id = auth.uid()) AND NOT is_admin())
WITH CHECK (assistant_id IN (SELECT assistants.id FROM public.assistants WHERE assistants.user_id = auth.uid()) AND NOT is_admin());

CREATE POLICY "plan_users_delete_own_assistant_subscriptions" ON public.assistant_subscriptions
FOR DELETE TO authenticated
USING (assistant_id IN (SELECT assistants.id FROM public.assistants WHERE assistants.user_id = auth.uid()) AND NOT is_admin());

-- Policy for admin_user (read-all)
CREATE POLICY "admin_users_select_all_assistant_subscriptions" ON public.assistant_subscriptions
FOR SELECT TO authenticated
USING (is_admin());

-- =============================================
-- RLS Policies for 'interactions' table
-- =============================================
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own interactions" ON public.interactions;
DROP POLICY IF EXISTS "Users can insert their own interactions" ON public.interactions;
DROP POLICY IF EXISTS "Users can update their own interactions" ON public.interactions;
DROP POLICY IF EXISTS "Users can delete their own interactions" ON public.interactions;

-- Policies for plan_user (non-admin) - SELECT ONLY
CREATE POLICY "plan_users_select_own_interactions" ON public.interactions
FOR SELECT TO authenticated
USING (
    (COALESCE(user_id, '00000000-0000-0000-0000-000000000000') = auth.uid() OR -- Check user_id if present
     assistant_id IN (SELECT assistants.id FROM public.assistants WHERE assistants.user_id = auth.uid())) -- Fallback to assistant_id
    AND NOT is_admin()
);

-- Policy for admin_user (read-all)
CREATE POLICY "admin_users_select_all_interactions" ON public.interactions
FOR SELECT TO authenticated
USING (is_admin());

-- =============================================
-- RLS Policies for 'assistant_limits' table
-- =============================================
ALTER TABLE public.assistant_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User access to assistant limits" ON public.assistant_limits;
DROP POLICY IF EXISTS "Users can insert their assistant limits" ON public.assistant_limits; -- Assuming a generic name if it existed
DROP POLICY IF EXISTS "Users can update their assistant limits" ON public.assistant_limits; -- Assuming a generic name if it existed
DROP POLICY IF EXISTS "Users can delete their assistant limits" ON public.assistant_limits; -- Assuming a generic name if it existed


-- Policies for plan_user (non-admin) - SELECT ONLY
CREATE POLICY "plan_users_select_own_assistant_limits" ON public.assistant_limits
FOR SELECT TO authenticated
USING (assistant_id IN (SELECT assistants.id FROM public.assistants WHERE assistants.user_id = auth.uid()) AND NOT is_admin());

-- Policy for admin_user (read-all)
CREATE POLICY "admin_users_select_all_assistant_limits" ON public.assistant_limits
FOR SELECT TO authenticated
USING (is_admin());

-- =============================================
-- RLS Policies for 'historical_usage' table
-- =============================================
ALTER TABLE public.historical_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User access to historical usage" ON public.historical_usage;
DROP POLICY IF EXISTS "Users can insert their historical usage" ON public.historical_usage;
DROP POLICY IF EXISTS "Users can update their historical usage" ON public.historical_usage;
DROP POLICY IF EXISTS "Users can delete their historical usage" ON public.historical_usage;

-- Policies for plan_user (non-admin) - SELECT ONLY
CREATE POLICY "plan_users_select_own_historical_usage" ON public.historical_usage
FOR SELECT TO authenticated
USING (assistant_id IN (SELECT assistants.id FROM public.assistants WHERE assistants.user_id = auth.uid()) AND NOT is_admin());

-- Policy for admin_user (read-all)
CREATE POLICY "admin_users_select_all_historical_usage" ON public.historical_usage
FOR SELECT TO authenticated
USING (is_admin());

-- =============================================
-- RLS Policies for 'usage_statistics' table
-- =============================================
ALTER TABLE public.usage_statistics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their usage statistics" ON public.usage_statistics;
DROP POLICY IF EXISTS "Users can insert their usage statistics" ON public.usage_statistics;
DROP POLICY IF EXISTS "Users can update their usage statistics" ON public.usage_statistics;
DROP POLICY IF EXISTS "Users can delete their usage statistics" ON public.usage_statistics;

-- Policies for plan_user (non-admin) - SELECT ONLY
CREATE POLICY "plan_users_select_own_usage_statistics" ON public.usage_statistics
FOR SELECT TO authenticated
USING (
  ((entity_type = 'user'::text AND entity_id = auth.uid()) OR
   (entity_type = 'assistant'::text AND entity_id IN (SELECT assistants.id FROM public.assistants WHERE assistants.user_id = auth.uid())))
  AND NOT is_admin()
);

-- Policy for admin_user (read-all)
CREATE POLICY "admin_users_select_all_usage_statistics" ON public.usage_statistics
FOR SELECT TO authenticated
USING (is_admin());

-- =============================================
-- RLS Policies for 'phone_numbers' table
-- =============================================
ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their assigned phone numbers" ON public.phone_numbers;
DROP POLICY IF EXISTS "Users can update their assigned phone numbers" ON public.phone_numbers;
DROP POLICY IF EXISTS "Users can insert phone numbers" ON public.phone_numbers;
DROP POLICY IF EXISTS "Users can delete phone numbers" ON public.phone_numbers;


-- Policies for plan_user (non-admin)
CREATE POLICY "plan_users_select_own_or_unassigned_phone_numbers" ON public.phone_numbers
FOR SELECT TO authenticated
USING (
  (assistant_id IS NULL OR assistant_id IN (SELECT assistants.id FROM public.assistants WHERE assistants.user_id = auth.uid()))
  AND NOT is_admin()
);

CREATE POLICY "plan_users_update_own_or_unassigned_phone_numbers" ON public.phone_numbers
FOR UPDATE TO authenticated
USING (
  (assistant_id IS NULL OR assistant_id IN (SELECT assistants.id FROM public.assistants WHERE assistants.user_id = auth.uid()))
  AND NOT is_admin()
)
WITH CHECK (
  (assistant_id IS NULL OR assistant_id IN (SELECT assistants.id FROM public.assistants WHERE assistants.user_id = auth.uid()))
  AND NOT is_admin()
);

-- Policy for admin_user (read-all)
CREATE POLICY "admin_users_select_all_phone_numbers" ON public.phone_numbers
FOR SELECT TO authenticated
USING (is_admin());

-- =============================================
-- RLS Policies for 'payment_sessions' table
-- =============================================
ALTER TABLE public.payment_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable users to view their own data only" ON public.payment_sessions;
DROP POLICY IF EXISTS "Users can view their own payment sessions" ON public.payment_sessions;
DROP POLICY IF EXISTS "Service role can manage all payment sessions" ON public.payment_sessions; -- Keep if it's just USING (true) for service_role
DROP POLICY IF EXISTS "Users can insert payment_sessions" ON public.payment_sessions;
DROP POLICY IF EXISTS "Users can update payment_sessions" ON public.payment_sessions;
DROP POLICY IF EXISTS "Users can delete payment_sessions" ON public.payment_sessions;


-- Policies for plan_user (non-admin)
CREATE POLICY "plan_users_select_own_payment_sessions" ON public.payment_sessions
FOR SELECT TO authenticated
USING (user_id = auth.uid() AND NOT is_admin());

CREATE POLICY "plan_users_insert_own_payment_sessions" ON public.payment_sessions
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND NOT is_admin());

CREATE POLICY "plan_users_update_own_payment_sessions" ON public.payment_sessions
FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND NOT is_admin())
WITH CHECK (user_id = auth.uid() AND NOT is_admin());
-- DELETE on payment_sessions is typically restricted or handled by backend logic.

-- Policy for admin_user (read-all)
CREATE POLICY "admin_users_select_all_payment_sessions" ON public.payment_sessions
FOR SELECT TO authenticated
USING (is_admin());

-- Re-add service role policy if it was dropped and is needed (standard Supabase one)
CREATE POLICY "Allow service_role full access on payment_sessions" ON public.payment_sessions
FOR ALL TO service_role
USING (true)
WITH CHECK (true);


-- =============================================
-- RLS Policies for 'audit_logs' table
-- =============================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view audit logs they created" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can insert their own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can update their own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can delete their own audit logs" ON public.audit_logs;

-- Policies for plan_user (non-admin)
CREATE POLICY "plan_users_select_own_audit_logs" ON public.audit_logs
FOR SELECT TO authenticated
USING (performed_by = auth.uid() AND NOT is_admin());

CREATE POLICY "plan_users_insert_own_audit_logs" ON public.audit_logs
FOR INSERT TO authenticated
WITH CHECK (performed_by = auth.uid() AND NOT is_admin());

-- Policy for admin_user (read-all)
CREATE POLICY "admin_users_select_all_audit_logs" ON public.audit_logs
FOR SELECT TO authenticated
USING (is_admin());
