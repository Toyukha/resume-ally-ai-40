REVOKE EXECUTE ON FUNCTION public.activate_pro_plan(uuid, text, int) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_pro_plan(uuid, text, int) TO service_role;