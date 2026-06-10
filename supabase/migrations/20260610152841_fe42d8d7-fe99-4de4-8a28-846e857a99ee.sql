
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paddle_subscription_id text NOT NULL UNIQUE,
  paddle_customer_id text NOT NULL,
  product_id text NOT NULL,
  price_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_paddle_id ON public.subscriptions(paddle_subscription_id);

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Activate plan with an exact expiry timestamp (used by Paddle webhook so we
-- mirror the real billing period rather than always adding 30 days).
CREATE OR REPLACE FUNCTION public.activate_pro_plan_until(
  _user_id uuid,
  _plan_tier text,
  _expires_at timestamptz
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF _plan_tier NOT IN ('pro_1','pro_2') THEN
    RAISE EXCEPTION 'invalid plan tier %', _plan_tier;
  END IF;
  IF _expires_at IS NULL OR _expires_at <= now() THEN
    RAISE EXCEPTION 'invalid expires_at %', _expires_at;
  END IF;
  UPDATE public.profiles
     SET plan = 'pro',
         plan_tier = _plan_tier,
         pro_started_at = COALESCE(pro_started_at, now()),
         pro_expires_at = _expires_at
   WHERE id = _user_id;
END;
$$;
