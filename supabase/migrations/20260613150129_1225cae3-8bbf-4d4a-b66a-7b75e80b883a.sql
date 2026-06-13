
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country_code TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_country_code ON public.profiles(country_code);

CREATE OR REPLACE FUNCTION public.validate_profile_country_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.country_code IS NOT NULL AND NEW.country_code !~ '^[A-Z]{2}$' THEN
    RAISE EXCEPTION 'country_code must be a 2-letter uppercase ISO code (got %)', NEW.country_code;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_validate_country_code ON public.profiles;
CREATE TRIGGER profiles_validate_country_code
BEFORE INSERT OR UPDATE OF country_code ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.validate_profile_country_code();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_country TEXT;
BEGIN
  v_country := upper(NULLIF(NEW.raw_user_meta_data->>'country_code', ''));
  IF v_country IS NOT NULL AND v_country !~ '^[A-Z]{2}$' THEN
    v_country := NULL;
  END IF;

  INSERT INTO public.profiles (id, plan, country_code)
  VALUES (NEW.id, 'free', v_country)
  ON CONFLICT (id) DO UPDATE
    SET country_code = COALESCE(public.profiles.country_code, EXCLUDED.country_code);

  IF lower(NEW.email) = 'oyeyemiyunus24@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
