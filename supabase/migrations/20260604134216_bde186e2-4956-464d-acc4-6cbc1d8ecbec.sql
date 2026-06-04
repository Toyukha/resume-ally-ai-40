REVOKE EXECUTE ON FUNCTION public.is_pro_active(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_pro_active(uuid) TO service_role;