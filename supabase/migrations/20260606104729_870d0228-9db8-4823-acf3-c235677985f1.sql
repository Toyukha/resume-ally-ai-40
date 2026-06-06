
-- 1. Storage policies for `resumes` bucket (private, per-user folder)
DROP POLICY IF EXISTS "Resumes: users read own" ON storage.objects;
CREATE POLICY "Resumes: users read own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Resumes: users insert own" ON storage.objects;
CREATE POLICY "Resumes: users insert own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Resumes: users delete own" ON storage.objects;
CREATE POLICY "Resumes: users delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 2. analyses.resume_storage_path
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS resume_storage_path text;

-- 3. analysis_jobs queue
CREATE TABLE IF NOT EXISTS public.analysis_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  resume_text text NOT NULL,
  job_description text NOT NULL,
  resume_filename text,
  resume_storage_path text,
  analysis_id uuid REFERENCES public.analyses(id) ON DELETE SET NULL,
  error text,
  attempts int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS analysis_jobs_status_idx ON public.analysis_jobs (status, created_at);
CREATE INDEX IF NOT EXISTS analysis_jobs_user_idx ON public.analysis_jobs (user_id, created_at DESC);

GRANT SELECT, INSERT ON public.analysis_jobs TO authenticated;
GRANT ALL ON public.analysis_jobs TO service_role;
ALTER TABLE public.analysis_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own jobs" ON public.analysis_jobs;
CREATE POLICY "Users view own jobs" ON public.analysis_jobs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own jobs" ON public.analysis_jobs;
CREATE POLICY "Users insert own jobs" ON public.analysis_jobs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins view all jobs" ON public.analysis_jobs;
CREATE POLICY "Admins view all jobs" ON public.analysis_jobs FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- 4. Capacity snapshot helper (admin only)
CREATE OR REPLACE FUNCTION public.get_capacity_snapshot()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT jsonb_build_object(
    'db_size_bytes', pg_database_size(current_database()),
    'analyses_total', (SELECT count(*) FROM public.analyses),
    'analyses_this_month', (SELECT count(*) FROM public.analyses WHERE created_at >= date_trunc('month', now())),
    'jobs_pending', (SELECT count(*) FROM public.analysis_jobs WHERE status = 'pending'),
    'jobs_failed_24h', (SELECT count(*) FROM public.analysis_jobs WHERE status = 'failed' AND created_at > now() - interval '24 hours'),
    'active_pro', (SELECT count(*) FROM public.profiles WHERE plan = 'pro' AND pro_expires_at > now()),
    'users_total', (SELECT count(*) FROM public.profiles)
  ) INTO result;
  RETURN result;
END;
$$;

-- 5. Enable pg_cron + pg_net
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
