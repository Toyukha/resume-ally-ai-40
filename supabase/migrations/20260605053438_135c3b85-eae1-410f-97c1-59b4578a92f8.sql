
-- 1) Fix is_admin to only return true for actual admin roles
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND suspended = false
      AND role IN ('admin', 'super_admin')
  );
$$;

-- 2) Prevent users from escalating their own plan/billing/suspension fields
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND plan = (SELECT p.plan FROM public.profiles p WHERE p.id = auth.uid())
  AND suspended IS NOT DISTINCT FROM (SELECT p.suspended FROM public.profiles p WHERE p.id = auth.uid())
  AND pro_started_at IS NOT DISTINCT FROM (SELECT p.pro_started_at FROM public.profiles p WHERE p.id = auth.uid())
  AND pro_expires_at IS NOT DISTINCT FROM (SELECT p.pro_expires_at FROM public.profiles p WHERE p.id = auth.uid())
);
