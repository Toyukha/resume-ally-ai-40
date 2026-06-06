REVOKE EXECUTE ON FUNCTION public.get_capacity_snapshot() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_capacity_snapshot() TO service_role;