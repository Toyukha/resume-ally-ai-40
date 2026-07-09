
CREATE TABLE public.auth_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL CHECK (event IN (
    'verification_email_opened',
    'verify_callback_success',
    'verify_callback_failed',
    'resend_verification_clicked',
    'resend_verification_sent',
    'resend_verification_failed'
  )),
  email_hash text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.auth_events TO authenticated;
GRANT INSERT ON public.auth_events TO anon;
GRANT ALL ON public.auth_events TO service_role;

ALTER TABLE public.auth_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can insert anonymous auth events"
  ON public.auth_events FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Authenticated can insert own auth events"
  ON public.auth_events FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users read own auth events"
  ON public.auth_events FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX auth_events_event_created_at_idx
  ON public.auth_events (event, created_at DESC);
CREATE INDEX auth_events_email_hash_idx
  ON public.auth_events (email_hash);
