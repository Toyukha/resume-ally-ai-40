
-- 1. Scope analyses policy to authenticated
DROP POLICY IF EXISTS "Users manage their own analyses" ON public.analyses;
CREATE POLICY "Users manage their own analyses"
  ON public.analyses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Add owner-scoped UPDATE/DELETE for analysis_jobs (deny-by-default otherwise)
CREATE POLICY "Users update own jobs"
  ON public.analysis_jobs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own jobs"
  ON public.analysis_jobs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Block all client writes to payments (service_role bypasses RLS)
CREATE POLICY "Block client inserts on payments"
  ON public.payments
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (false);

CREATE POLICY "Block client updates on payments"
  ON public.payments
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Block client deletes on payments"
  ON public.payments
  AS RESTRICTIVE
  FOR DELETE
  TO authenticated, anon
  USING (false);
