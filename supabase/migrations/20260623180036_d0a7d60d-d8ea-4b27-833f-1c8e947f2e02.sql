
-- 1) Hide companies.contact_email from anonymous visitors via column-level grants
REVOKE SELECT ON public.companies FROM anon;
GRANT SELECT (id, name, slug, industry, logo_url, website, description, size, hq_location, plan, created_by, created_at, updated_at) ON public.companies TO anon;

-- 2) Lock down SECURITY DEFINER functions: revoke from PUBLIC/anon, grant to authenticated + service_role
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC, anon', r.nspname, r.proname, r.args);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated, service_role', r.nspname, r.proname, r.args);
  END LOOP;
END $$;
