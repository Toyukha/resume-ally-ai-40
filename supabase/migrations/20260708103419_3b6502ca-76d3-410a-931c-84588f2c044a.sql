CREATE TABLE public.pwa_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL CHECK (event IN ('prompt_shown','prompt_accepted','prompt_dismissed','ios_hint_shown','ios_hint_dismissed','installed','first_dashboard_visit_installed')),
  platform text,
  user_agent text,
  session_id text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pwa_events_event_created_at_idx ON public.pwa_events(event, created_at DESC);
CREATE INDEX pwa_events_user_id_idx ON public.pwa_events(user_id);
GRANT INSERT ON public.pwa_events TO anon, authenticated;
GRANT SELECT ON public.pwa_events TO authenticated;
GRANT ALL ON public.pwa_events TO service_role;
ALTER TABLE public.pwa_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can insert pwa events" ON public.pwa_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins can read pwa events" ON public.pwa_events FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'super_admin')
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'analytics_admin')
);