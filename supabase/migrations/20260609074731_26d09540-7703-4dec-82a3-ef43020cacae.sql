
-- 1) Harden the trigger: allow updates when no auth user (server-side service role)
CREATE OR REPLACE FUNCTION public.prevent_billing_field_self_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  is_privileged boolean;
BEGIN
  -- Service role bypass
  IF current_setting('request.jwt.claim.role', true) = 'service_role'
     OR current_user = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- No authenticated user => server-side (service role admin client) bypass
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Admins
  is_privileged := public.is_admin(auth.uid());
  IF is_privileged THEN
    RETURN NEW;
  END IF;

  IF NEW.plan IS DISTINCT FROM OLD.plan
     OR NEW.plan_tier IS DISTINCT FROM OLD.plan_tier
     OR NEW.suspended IS DISTINCT FROM OLD.suspended
     OR NEW.pro_started_at IS DISTINCT FROM OLD.pro_started_at
     OR NEW.pro_expires_at IS DISTINCT FROM OLD.pro_expires_at THEN
    RAISE EXCEPTION 'Not allowed to modify billing fields';
  END IF;

  RETURN NEW;
END;
$function$;

-- 2) SECURITY DEFINER RPC for plan activation
CREATE OR REPLACE FUNCTION public.activate_pro_plan(_user_id uuid, _plan_tier text, _days int)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  IF _plan_tier NOT IN ('pro_1','pro_2') THEN
    RAISE EXCEPTION 'invalid plan tier %', _plan_tier;
  END IF;
  IF _days IS NULL OR _days < 1 OR _days > 366 THEN
    RAISE EXCEPTION 'invalid days %', _days;
  END IF;
  UPDATE public.profiles
     SET plan = 'pro',
         plan_tier = _plan_tier,
         pro_started_at = now(),
         pro_expires_at = now() + (_days || ' days')::interval
   WHERE id = _user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.activate_pro_plan(uuid, text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_pro_plan(uuid, text, int) TO service_role;

-- 3) Backfill the affected user
UPDATE public.profiles
   SET plan = 'pro',
       plan_tier = 'pro_1',
       pro_started_at = '2026-06-09 07:39:03+00',
       pro_expires_at = '2026-06-09 07:39:03+00'::timestamptz + interval '30 days'
 WHERE id = (SELECT id FROM auth.users WHERE lower(email) = 'opeyemioyeyemi00@gmail.com');
