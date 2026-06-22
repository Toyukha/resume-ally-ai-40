
-- ============================================================
-- Employer Portal: companies, members, jobs, ATS, interviews
-- ============================================================

-- ============ ENUMS ============
CREATE TYPE public.company_role AS ENUM ('admin','recruiter','hiring_manager');
CREATE TYPE public.company_member_status AS ENUM ('active','invited','suspended');
CREATE TYPE public.employer_job_status AS ENUM ('draft','active','closed','archived');
CREATE TYPE public.employer_job_type AS ENUM ('full_time','part_time','contract','internship','temporary');
CREATE TYPE public.work_mode AS ENUM ('remote','hybrid','onsite');
CREATE TYPE public.apply_mode AS ENUM ('in_app','external');
CREATE TYPE public.application_stage AS ENUM (
  'applied','under_review','shortlisted','interview_scheduled',
  'assessment','final_review','offer_sent','hired','rejected'
);
CREATE TYPE public.interview_status AS ENUM ('scheduled','completed','passed','failed','cancelled');
CREATE TYPE public.interview_mode AS ENUM ('video','phone','onsite');
CREATE TYPE public.employer_plan AS ENUM ('starter','growth','enterprise');

-- ============ COMPANIES ============
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  industry text,
  logo_url text,
  website text,
  description text,
  size text,
  hq_location text,
  contact_email text,
  plan public.employer_plan NOT NULL DEFAULT 'starter',
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT SELECT ON public.companies TO anon;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- ============ COMPANY MEMBERS ============
CREATE TABLE public.company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.company_role NOT NULL DEFAULT 'recruiter',
  status public.company_member_status NOT NULL DEFAULT 'active',
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);
CREATE INDEX idx_company_members_user ON public.company_members(user_id);
CREATE INDEX idx_company_members_company ON public.company_members(company_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_members TO authenticated;
GRANT ALL ON public.company_members TO service_role;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- ============ COMPANY INVITES ============
CREATE TABLE public.company_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.company_role NOT NULL DEFAULT 'recruiter',
  token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_company_invites_email ON public.company_invites(lower(email));
CREATE INDEX idx_company_invites_company ON public.company_invites(company_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_invites TO authenticated;
GRANT ALL ON public.company_invites TO service_role;
ALTER TABLE public.company_invites ENABLE ROW LEVEL SECURITY;

-- ============ EMPLOYER JOBS ============
CREATE TABLE public.employer_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  posted_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  title text NOT NULL,
  department text,
  employment_type public.employer_job_type NOT NULL DEFAULT 'full_time',
  work_mode public.work_mode NOT NULL DEFAULT 'onsite',
  location text,
  salary_min integer,
  salary_max integer,
  currency text NOT NULL DEFAULT 'USD',
  description text NOT NULL,
  responsibilities text,
  required_skills text[] NOT NULL DEFAULT '{}',
  preferred_skills text[] NOT NULL DEFAULT '{}',
  experience_level text,
  education text,
  vacancies integer NOT NULL DEFAULT 1,
  deadline date,
  status public.employer_job_status NOT NULL DEFAULT 'draft',
  apply_mode public.apply_mode NOT NULL DEFAULT 'in_app',
  external_url text,
  view_count integer NOT NULL DEFAULT 0,
  application_count integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_employer_jobs_company ON public.employer_jobs(company_id);
CREATE INDEX idx_employer_jobs_status ON public.employer_jobs(status);
CREATE INDEX idx_employer_jobs_published ON public.employer_jobs(published_at DESC) WHERE status = 'active';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employer_jobs TO authenticated;
GRANT SELECT ON public.employer_jobs TO anon;
GRANT ALL ON public.employer_jobs TO service_role;
ALTER TABLE public.employer_jobs ENABLE ROW LEVEL SECURITY;

-- ============ EMPLOYER APPLICATIONS ============
CREATE TABLE public.employer_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.employer_jobs(id) ON DELETE CASCADE,
  candidate_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_name text,
  candidate_email text,
  resume_text text,
  resume_file_path text,
  cover_letter text,
  stage public.application_stage NOT NULL DEFAULT 'applied',
  source text,
  rejected_reason text,
  applied_at timestamptz NOT NULL DEFAULT now(),
  last_stage_change_at timestamptz NOT NULL DEFAULT now(),
  hired_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, candidate_user_id)
);
CREATE INDEX idx_emp_apps_job ON public.employer_applications(job_id);
CREATE INDEX idx_emp_apps_candidate ON public.employer_applications(candidate_user_id);
CREATE INDEX idx_emp_apps_stage ON public.employer_applications(stage);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employer_applications TO authenticated;
GRANT ALL ON public.employer_applications TO service_role;
ALTER TABLE public.employer_applications ENABLE ROW LEVEL SECURITY;

-- ============ CANDIDATE SCORES ============
CREATE TABLE public.candidate_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL UNIQUE REFERENCES public.employer_applications(id) ON DELETE CASCADE,
  ats_score integer NOT NULL DEFAULT 0,
  skills_match_pct integer NOT NULL DEFAULT 0,
  experience_match_pct integer NOT NULL DEFAULT 0,
  education_match_pct integer NOT NULL DEFAULT 0,
  keyword_match_pct integer NOT NULL DEFAULT 0,
  strengths jsonb NOT NULL DEFAULT '[]'::jsonb,
  gaps jsonb NOT NULL DEFAULT '[]'::jsonb,
  missing_keywords text[] NOT NULL DEFAULT '{}',
  summary text,
  model text,
  scored_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidate_scores TO authenticated;
GRANT ALL ON public.candidate_scores TO service_role;
ALTER TABLE public.candidate_scores ENABLE ROW LEVEL SECURITY;

-- ============ INTERVIEWS ============
CREATE TABLE public.interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.employer_applications(id) ON DELETE CASCADE,
  scheduled_for timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  mode public.interview_mode NOT NULL DEFAULT 'video',
  location_or_link text,
  status public.interview_status NOT NULL DEFAULT 'scheduled',
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_interviews_app ON public.interviews(application_id);
CREATE INDEX idx_interviews_scheduled ON public.interviews(scheduled_for);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interviews TO authenticated;
GRANT ALL ON public.interviews TO service_role;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- ============ INTERVIEW NOTES ============
CREATE TABLE public.interview_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  rating integer CHECK (rating BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_interview_notes_interview ON public.interview_notes(interview_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_notes TO authenticated;
GRANT ALL ON public.interview_notes TO service_role;
ALTER TABLE public.interview_notes ENABLE ROW LEVEL SECURITY;

-- ============ RECRUITER ACTIVITY ============
CREATE TABLE public.recruiter_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  kind text NOT NULL,
  entity_type text,
  entity_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_recruiter_activity_company ON public.recruiter_activity(company_id, created_at DESC);
GRANT SELECT, INSERT ON public.recruiter_activity TO authenticated;
GRANT ALL ON public.recruiter_activity TO service_role;
ALTER TABLE public.recruiter_activity ENABLE ROW LEVEL SECURITY;

-- ============ HELPER FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.is_company_member(_company uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = _company AND user_id = _user AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_company_role(_company uuid, _user uuid, _roles public.company_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = _company AND user_id = _user
      AND status = 'active' AND role = ANY(_roles)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_company_admin(_company uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_company_role(_company, _user, ARRAY['admin']::public.company_role[]);
$$;

CREATE OR REPLACE FUNCTION public.can_manage_jobs(_company uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_company_role(_company, _user, ARRAY['admin','recruiter']::public.company_role[]);
$$;

-- ============ TRIGGERS ============
CREATE TRIGGER tr_companies_updated BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_company_members_updated BEFORE UPDATE ON public.company_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_employer_jobs_updated BEFORE UPDATE ON public.employer_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_emp_apps_updated BEFORE UPDATE ON public.employer_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_interviews_updated BEFORE UPDATE ON public.interviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-touch last_stage_change_at when stage changes
CREATE OR REPLACE FUNCTION public.touch_stage_change()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.stage IS DISTINCT FROM OLD.stage THEN
    NEW.last_stage_change_at = now();
    IF NEW.stage = 'hired' AND OLD.stage <> 'hired' THEN
      NEW.hired_at = now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER tr_emp_apps_stage BEFORE UPDATE ON public.employer_applications
  FOR EACH ROW EXECUTE FUNCTION public.touch_stage_change();

-- Bump application_count on new application
CREATE OR REPLACE FUNCTION public.bump_application_count()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE public.employer_jobs SET application_count = application_count + 1 WHERE id = NEW.job_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER tr_emp_apps_count AFTER INSERT ON public.employer_applications
  FOR EACH ROW EXECUTE FUNCTION public.bump_application_count();

-- ============ RLS POLICIES ============
-- companies: members can read; created_by/admin can update; anyone authenticated can create
CREATE POLICY "Public can view companies" ON public.companies
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated can create companies" ON public.companies
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Admins update their company" ON public.companies
  FOR UPDATE TO authenticated USING (public.is_company_admin(id, auth.uid()))
  WITH CHECK (public.is_company_admin(id, auth.uid()));
CREATE POLICY "Admins delete their company" ON public.companies
  FOR DELETE TO authenticated USING (public.is_company_admin(id, auth.uid()));

-- company_members: members read same-company rows; admins write; user can read own rows; user can self-insert (for invite acceptance via trusted server fn — handled via service role typically, but allow self read)
CREATE POLICY "Members read same company" ON public.company_members
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR public.is_company_member(company_id, auth.uid())
  );
CREATE POLICY "Creator can insert self as first member" ON public.company_members
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins manage members" ON public.company_members
  FOR UPDATE TO authenticated USING (public.is_company_admin(company_id, auth.uid()))
  WITH CHECK (public.is_company_admin(company_id, auth.uid()));
CREATE POLICY "Admins delete members" ON public.company_members
  FOR DELETE TO authenticated USING (public.is_company_admin(company_id, auth.uid()));

-- company_invites: admins manage; invited email can read own
CREATE POLICY "Admins manage invites" ON public.company_invites
  FOR ALL TO authenticated
  USING (public.is_company_admin(company_id, auth.uid()))
  WITH CHECK (public.is_company_admin(company_id, auth.uid()));
CREATE POLICY "Invited user can read own invites" ON public.company_invites
  FOR SELECT TO authenticated USING (
    lower(email) = lower(COALESCE((auth.jwt() ->> 'email'), ''))
  );

-- employer_jobs: members read; can_manage_jobs role writes; public anon reads active
CREATE POLICY "Public reads active jobs" ON public.employer_jobs
  FOR SELECT TO anon, authenticated USING (status = 'active');
CREATE POLICY "Members read all company jobs" ON public.employer_jobs
  FOR SELECT TO authenticated USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "Recruiters insert jobs" ON public.employer_jobs
  FOR INSERT TO authenticated WITH CHECK (
    public.can_manage_jobs(company_id, auth.uid()) AND posted_by = auth.uid()
  );
CREATE POLICY "Recruiters update jobs" ON public.employer_jobs
  FOR UPDATE TO authenticated USING (public.can_manage_jobs(company_id, auth.uid()))
  WITH CHECK (public.can_manage_jobs(company_id, auth.uid()));
CREATE POLICY "Recruiters delete jobs" ON public.employer_jobs
  FOR DELETE TO authenticated USING (public.can_manage_jobs(company_id, auth.uid()));

-- employer_applications: candidate manages own; company members read; recruiters update stage
CREATE POLICY "Candidate reads own application" ON public.employer_applications
  FOR SELECT TO authenticated USING (candidate_user_id = auth.uid());
CREATE POLICY "Candidate creates application" ON public.employer_applications
  FOR INSERT TO authenticated WITH CHECK (candidate_user_id = auth.uid());
CREATE POLICY "Company members read applications" ON public.employer_applications
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.employer_jobs j
      WHERE j.id = job_id AND public.is_company_member(j.company_id, auth.uid())
    )
  );
CREATE POLICY "Recruiters update applications" ON public.employer_applications
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.employer_jobs j
      WHERE j.id = job_id AND public.can_manage_jobs(j.company_id, auth.uid())
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employer_jobs j
      WHERE j.id = job_id AND public.can_manage_jobs(j.company_id, auth.uid())
    )
  );

-- candidate_scores: company members read; service or recruiters insert/update
CREATE POLICY "Company members read scores" ON public.candidate_scores
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.employer_applications a
      JOIN public.employer_jobs j ON j.id = a.job_id
      WHERE a.id = application_id AND public.is_company_member(j.company_id, auth.uid())
    )
  );
CREATE POLICY "Recruiters write scores" ON public.candidate_scores
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employer_applications a
      JOIN public.employer_jobs j ON j.id = a.job_id
      WHERE a.id = application_id AND public.can_manage_jobs(j.company_id, auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employer_applications a
      JOIN public.employer_jobs j ON j.id = a.job_id
      WHERE a.id = application_id AND public.can_manage_jobs(j.company_id, auth.uid())
    )
  );

-- interviews
CREATE POLICY "Company members read interviews" ON public.interviews
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.employer_applications a
      JOIN public.employer_jobs j ON j.id = a.job_id
      WHERE a.id = application_id AND public.is_company_member(j.company_id, auth.uid())
    )
  );
CREATE POLICY "Recruiters manage interviews" ON public.interviews
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employer_applications a
      JOIN public.employer_jobs j ON j.id = a.job_id
      WHERE a.id = application_id AND public.can_manage_jobs(j.company_id, auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employer_applications a
      JOIN public.employer_jobs j ON j.id = a.job_id
      WHERE a.id = application_id AND public.can_manage_jobs(j.company_id, auth.uid())
    )
  );
-- Candidate can read own interviews
CREATE POLICY "Candidate reads own interviews" ON public.interviews
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.employer_applications a
      WHERE a.id = application_id AND a.candidate_user_id = auth.uid()
    )
  );

-- interview_notes
CREATE POLICY "Company members read notes" ON public.interview_notes
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.interviews i
      JOIN public.employer_applications a ON a.id = i.application_id
      JOIN public.employer_jobs j ON j.id = a.job_id
      WHERE i.id = interview_id AND public.is_company_member(j.company_id, auth.uid())
    )
  );
CREATE POLICY "Recruiters write notes" ON public.interview_notes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.interviews i
      JOIN public.employer_applications a ON a.id = i.application_id
      JOIN public.employer_jobs j ON j.id = a.job_id
      WHERE i.id = interview_id AND public.can_manage_jobs(j.company_id, auth.uid())
    )
  )
  WITH CHECK (
    author_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.interviews i
      JOIN public.employer_applications a ON a.id = i.application_id
      JOIN public.employer_jobs j ON j.id = a.job_id
      WHERE i.id = interview_id AND public.can_manage_jobs(j.company_id, auth.uid())
    )
  );

-- recruiter_activity
CREATE POLICY "Company members read activity" ON public.recruiter_activity
  FOR SELECT TO authenticated USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "Members log activity" ON public.recruiter_activity
  FOR INSERT TO authenticated WITH CHECK (
    public.is_company_member(company_id, auth.uid()) AND actor_id = auth.uid()
  );
