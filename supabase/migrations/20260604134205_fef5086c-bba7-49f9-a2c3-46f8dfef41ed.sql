ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pro_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS pro_expires_at timestamptz;

-- Helper: check if a pro subscription is currently active
CREATE OR REPLACE FUNCTION public.is_pro_active(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id
      AND plan = 'pro'
      AND pro_expires_at IS NOT NULL
      AND pro_expires_at > now()
  );
$$;