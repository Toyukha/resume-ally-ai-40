
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND plan = (SELECT p.plan FROM public.profiles p WHERE p.id = auth.uid())
    AND plan_tier = (SELECT p.plan_tier FROM public.profiles p WHERE p.id = auth.uid())
    AND NOT (suspended IS DISTINCT FROM (SELECT p.suspended FROM public.profiles p WHERE p.id = auth.uid()))
    AND NOT (pro_started_at IS DISTINCT FROM (SELECT p.pro_started_at FROM public.profiles p WHERE p.id = auth.uid()))
    AND NOT (pro_expires_at IS DISTINCT FROM (SELECT p.pro_expires_at FROM public.profiles p WHERE p.id = auth.uid()))
  );

CREATE POLICY "Resumes: users update own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);
