
-- Enum for application status
DO $$ BEGIN
  CREATE TYPE public.application_status AS ENUM ('saved','applied','interview','assessment','offer','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- saved_jobs
CREATE TABLE public.saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'arbeitnow',
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT,
  location TEXT,
  employment_type TEXT,
  remote BOOLEAN NOT NULL DEFAULT false,
  posted_at TIMESTAMPTZ,
  url TEXT,
  description TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  favorited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider, external_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_jobs TO authenticated;
GRANT ALL ON public.saved_jobs TO service_role;

ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own saved jobs" ON public.saved_jobs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_saved_jobs_updated_at BEFORE UPDATE ON public.saved_jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX saved_jobs_user_created_idx ON public.saved_jobs (user_id, created_at DESC);

-- job_applications
CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  saved_job_id UUID REFERENCES public.saved_jobs(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'arbeitnow',
  external_id TEXT,
  title TEXT NOT NULL,
  company TEXT,
  url TEXT,
  status public.application_status NOT NULL DEFAULT 'saved',
  notes TEXT,
  applied_at TIMESTAMPTZ,
  last_status_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO authenticated;
GRANT ALL ON public.job_applications TO service_role;

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own applications" ON public.job_applications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON public.job_applications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX job_applications_user_status_idx ON public.job_applications (user_id, status, sort_order);

-- job_matches
CREATE TABLE public.job_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'arbeitnow',
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT,
  match_score INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_matches TO authenticated;
GRANT ALL ON public.job_matches TO service_role;

ALTER TABLE public.job_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own job matches" ON public.job_matches FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX job_matches_user_external_idx ON public.job_matches (user_id, provider, external_id);
CREATE INDEX job_matches_user_created_idx ON public.job_matches (user_id, created_at DESC);
