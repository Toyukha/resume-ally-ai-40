
CREATE TABLE public.payment_activation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  event text NOT NULL,
  success boolean NOT NULL DEFAULT false,
  user_id uuid,
  user_email text,
  tx_ref text,
  payment_id uuid,
  plan_tier text,
  last_known_plan text,
  last_known_plan_tier text,
  elapsed_ms integer,
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX payment_activation_events_created_at_idx ON public.payment_activation_events (created_at DESC);
CREATE INDEX payment_activation_events_success_idx ON public.payment_activation_events (success, created_at DESC);
CREATE INDEX payment_activation_events_tx_ref_idx ON public.payment_activation_events (tx_ref);
CREATE INDEX payment_activation_events_user_idx ON public.payment_activation_events (user_id);

GRANT SELECT ON public.payment_activation_events TO authenticated;
GRANT ALL ON public.payment_activation_events TO service_role;

ALTER TABLE public.payment_activation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view activation events"
  ON public.payment_activation_events
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));
