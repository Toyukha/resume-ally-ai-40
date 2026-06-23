ALTER TABLE public.companies DROP CONSTRAINT companies_created_by_fkey,
  ADD CONSTRAINT companies_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.employer_jobs DROP CONSTRAINT employer_jobs_posted_by_fkey,
  ADD CONSTRAINT employer_jobs_posted_by_fkey FOREIGN KEY (posted_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.user_roles DROP CONSTRAINT user_roles_assigned_by_fkey,
  ADD CONSTRAINT user_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.companies ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.employer_jobs ALTER COLUMN posted_by DROP NOT NULL;