
-- Lock down SECURITY DEFINER helper functions that never need to be callable
-- from the Data API by anon/authenticated. They are invoked by triggers and
-- pg_cron (which runs as postgres/service_role).
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM PUBLIC, anon, authenticated;

-- Tighten the permissive pwa_events INSERT policy so callers can only insert
-- rows attributed to themselves (or anonymous rows with NULL user_id).
DROP POLICY IF EXISTS "anyone can insert pwa events" ON public.pwa_events;

CREATE POLICY "Anon can insert anonymous pwa events"
  ON public.pwa_events
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Authenticated can insert own pwa events"
  ON public.pwa_events
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
