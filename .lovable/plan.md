## Plan

### 1. Verify employer auth guard
- `/employer/*` routes live under `_authenticated/`, so the integration-managed gate at `src/routes/_authenticated/route.tsx` already redirects unauthenticated users to `/auth` (not `/employer/login`).
- Issue: the employer login page redirects to `/employer/dashboard`, but if a user lands on `/employer/dashboard` directly without a session, they get bounced to `/auth` (job-seeker login), not `/employer/login`. Fix by adding a `from=employer` search param on the redirect and updating `/auth` to honor it — OR simpler: change `_authenticated/route.tsx`? That file is integration-managed; do NOT edit.
- Solution: add a tiny client-side check in `src/routes/_authenticated/employer.tsx` — if `useQuery(listMyCompanies)` returns an auth error, redirect to `/employer/login` instead of relying on the generic gate. Also detect "no session" early and redirect there. Keeps integration files untouched.
- Add a "Sign in as employer" link on `/auth` page footer pointing to `/employer/login` so recruiters who get bounced can self-correct.

### 2. Add recruiter signup option
Create `src/routes/employer.signup.tsx` (public, `ssr: false`):
- Fields: full name, work email, password, company name (optional — can be set later in onboarding).
- Calls `supabase.auth.signUp` with `emailRedirectTo: window.location.origin + "/employer/onboarding"` and `data: { full_name }` metadata.
- Google OAuth button via `lovable.auth.signInWithOAuth("google", { redirect_uri: origin + "/employer/onboarding" })`.
- On success → navigate to `/employer/onboarding` (existing route already prompts to create a company).
- Update `/employer/login` "New here?" card to link to `/employer/signup` instead of `/auth`.
- Add small "Create employer account" link on `/auth` page too.

### 3. Implement employer dashboard
The dashboard route + `getDashboardSnapshot` server fn already exist and render KPIs, top matches, and activity. Enhancements:
- Add **quick actions row** under the header: Post job, Invite teammate, View pipeline, View interviews.
- Add **Jobs at a glance** card (lg:col-span-2 second row): list 5 most recent active jobs with applicant counts and a "View" link — extend `getDashboardSnapshot` to return `recentJobs: [{ id, title, status, applicationCount, deadline }]` (one extra query on `employer_jobs`).
- Add **Pipeline funnel** mini-chart card: counts per stage (applied, screening, interview, offer, hired, rejected) — extend snapshot with `funnel: Record<stage, number>` via a single grouped query on `employer_applications` joined to company jobs. Render as horizontal bars using existing tailwind primitives (no new chart lib).
- Empty state when no jobs: large CTA card with "Post your first job" instead of the bare KPI grid.
- Wire activity items to deep-link where possible (job_posted → `/employer/jobs/$id`, application_received → `/employer/candidates/$id`) when payload contains the id.

### Files

**New**
- `src/routes/employer.signup.tsx`

**Edited**
- `src/lib/employer/dashboard.functions.ts` — add `recentJobs` and `funnel` to return shape.
- `src/routes/_authenticated/employer.dashboard.tsx` — quick actions, recent jobs card, funnel card, empty state, activity deep-links.
- `src/routes/_authenticated/employer.tsx` — on `listMyCompanies` error/no-session, redirect to `/employer/login`.
- `src/routes/employer.login.tsx` — point "New here?" to `/employer/signup`.
- `src/routes/auth.tsx` — add small "Employer? Sign in / Sign up" link.

### Out of scope
- No DB schema changes (no migrations).
- No changes to `_authenticated/route.tsx` or other integration-managed files.
- No new chart libraries.
