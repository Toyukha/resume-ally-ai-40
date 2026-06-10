
REVOKE EXECUTE ON FUNCTION public.activate_pro_plan_until(uuid, text, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_pro_plan_until(uuid, text, timestamptz) TO service_role;
