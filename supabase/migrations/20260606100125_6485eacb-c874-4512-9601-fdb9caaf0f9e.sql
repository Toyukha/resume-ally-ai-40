-- 1. Add plan_tier to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan_tier text NOT NULL DEFAULT 'free'
  CHECK (plan_tier IN ('free','pro_1','pro_2','pro_legacy'));

-- 2. Backfill existing pro users -> pro_legacy (unlimited until expiry)
UPDATE public.profiles
  SET plan_tier = 'pro_legacy'
  WHERE plan = 'pro' AND pro_expires_at IS NOT NULL AND pro_expires_at > now();

-- 3. Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tx_ref text NOT NULL UNIQUE,
  flw_transaction_id text,
  plan_tier text NOT NULL CHECK (plan_tier IN ('pro_1','pro_2')),
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'NGN',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','successful','failed','cancelled')),
  flw_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz
);

GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS payments_user_id_idx ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS payments_tx_ref_idx ON public.payments(tx_ref);