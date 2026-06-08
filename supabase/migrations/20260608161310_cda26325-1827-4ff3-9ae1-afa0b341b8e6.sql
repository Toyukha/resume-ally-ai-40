
-- Replace the vulnerable self-referencing WITH CHECK with a simple ownership check,
-- and enforce billing-field immutability via a trigger that only service_role / admins can bypass.

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.prevent_billing_field_self_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_privileged boolean;
BEGIN
  -- service_role bypasses (used by edge/server functions with the service key)
  IF current_setting('request.jwt.claim.role', true) = 'service_role'
     OR current_user = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- admins / super_admins can manage billing fields
  is_privileged := public.is_admin(auth.uid());
  IF is_privileged THEN
    RETURN NEW;
  END IF;

  -- For everyone else, billing-related fields must remain unchanged
  IF NEW.plan IS DISTINCT FROM OLD.plan
     OR NEW.plan_tier IS DISTINCT FROM OLD.plan_tier
     OR NEW.suspended IS DISTINCT FROM OLD.suspended
     OR NEW.pro_started_at IS DISTINCT FROM OLD.pro_started_at
     OR NEW.pro_expires_at IS DISTINCT FROM OLD.pro_expires_at THEN
    RAISE EXCEPTION 'Not allowed to modify billing fields';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_billing_self_update ON public.profiles;
CREATE TRIGGER profiles_prevent_billing_self_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_billing_field_self_update();
