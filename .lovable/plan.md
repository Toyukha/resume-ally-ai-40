
# The Career Boost — Employer Portal (v1)

Scope confirmed: **MVP + Interviews & Analytics**, **In-app + external apply**, **Company with invited members**, **Soft plan limits only** (no Flutterwave wiring yet).

Out of v1: AI Recruiter Assistant chat, Top Candidates ranking page, paid plan checkout. (Hooks left in DB so we can add later without migration churn.)

---

## 1. Information architecture

New top-level area `/employer/*` (separate from the existing `/jobs/*` job-seeker flow). Job seekers and employers can share one auth account; role is determined by company membership.

```text
/employer
  /onboarding          -> create or join a company
  /dashboard           -> widgets + activity feed
  /jobs                -> list / filter (Draft, Active, Closed, Archived)
  /jobs/new            -> create
  /jobs/$id/edit
  /jobs/$id            -> job detail + applicants
  /candidates/$appId   -> candidate profile (ATS analysis, timeline, actions)
  /pipeline/$jobId     -> drag-and-drop Kanban (9 stages)
  /interviews          -> calendar/list view
  /analytics           -> funnel + KPIs
  /team                -> invite/manage members
  /settings/company    -> company profile fields
  /settings/plan       -> current plan + usage vs caps
```

Public marketplace: employer-posted Active jobs surface inside the existing `/jobs` browse page alongside Adzuna results (new `internal` provider).

All `/employer/*` routes live under `_authenticated/` and are additionally gated by a company-membership `beforeLoad` check.

---

## 2. Data model (Supabase)

One migration. Every public table gets GRANTs + RLS + policies.

**Enums**
- `company_role`: `admin | recruiter | hiring_manager`
- `employer_job_status`: `draft | active | closed | archived`
- `employer_job_type`: `full_time | part_time | contract | internship | temporary`
- `work_mode`: `remote | hybrid | onsite`
- `application_stage`: `applied | under_review | shortlisted | interview_scheduled | assessment | final_review | offer_sent | hired | rejected`
- `interview_status`: `scheduled | completed | passed | failed | cancelled`
- `employer_plan`: `starter | growth | enterprise`

**Tables**
- `companies` — name, industry, logo_url, website, description, size, hq_location, contact_email, plan (default `starter`), created_by
- `company_members` — company_id, user_id, role, status (`active | invited | suspended`), invited_email, invited_by, joined_at  (unique on company_id+user_id and company_id+lower(invited_email))
- `company_invites` — company_id, email, role, token (uuid), expires_at, accepted_at
- `employer_jobs` — company_id, posted_by, title, department, employment_type, work_mode, location, salary_min/max, currency, description, responsibilities, required_skills text[], preferred_skills text[], experience_level, education, vacancies, deadline, status, apply_mode (`in_app | external`), external_url, view_count, created_at, updated_at, published_at
- `job_applications` — *new table, distinct from existing `job_applications`* → rename existing tracker table to `seeker_job_tracker` in the same migration to free the name; new schema: job_id, candidate_user_id, resume_text, resume_file_path, cover_letter, stage (default `applied`), source, applied_at, last_stage_change_at, rejected_reason
- `candidate_scores` — application_id (unique), ats_score, skills_match_pct, experience_match_pct, education_match_pct, keyword_match_pct, strengths jsonb, gaps jsonb, missing_keywords text[], summary, model, scored_at
- `interviews` — application_id, scheduled_for, duration_minutes, mode (`video | phone | onsite`), location_or_link, status, created_by
- `interview_notes` — interview_id, author_id, body, rating (1-5 nullable)
- `recruiter_activity` — company_id, actor_id, kind, entity_type, entity_id, payload jsonb, created_at  (drives the activity feed)

**Security**
- `is_company_member(_company uuid, _user uuid)` and `has_company_role(_company, _user, _role)` SECURITY DEFINER helpers (mirrors existing `has_role` pattern, prevents RLS recursion).
- All employer tables: members can SELECT their company's rows; only `admin` + `recruiter` can INSERT/UPDATE jobs and move applicants; only `admin` can manage members/invites/company settings.
- `employer_jobs` also has a public anon SELECT policy filtered to `status = 'active'` for the marketplace.
- `job_applications`: candidate can SELECT/INSERT their own row; company members SELECT/UPDATE rows for their company's jobs.
- Update existing job-seeker code to point at the renamed `seeker_job_tracker` table.

---

## 3. AI ATS screening

Reuses existing `ai-gateway.server.ts` + Lovable AI (no new secret).

`analyzeEmployerApplication` server fn (`requireSupabaseAuth`, queued via existing `analysis_jobs` infra or run inline for v1):
1. Loads job (description, required/preferred skills, experience, education).
2. Loads application (resume_text, cover_letter).
3. Calls Gemini Flash with a JSON-schema prompt returning `{ats_score, skills_match_pct, experience_match_pct, education_match_pct, keyword_match_pct, strengths[], gaps[], missing_keywords[], summary }`.
4. Upserts `candidate_scores`. Triggered automatically on application insert (DB trigger enqueues, edge consumer processes) **and** re-runnable from candidate profile.

Score visualization reuses `MatchScoreRing` + new horizontal bar component for the four sub-percentages.

---

## 4. Application flow

**Marketplace card** for `provider = "internal"` jobs:
- `apply_mode = in_app`: opens existing `AnalyzeJobSheet`-style flow but submits a `job_applications` row (resume upload required, cover letter optional). Score runs automatically.
- `apply_mode = external`: behaves like Adzuna — outbound link, no row created.

**Pipeline Kanban** (`/employer/pipeline/$jobId`):
- 9 columns matching `application_stage`. Drag-and-drop with `@dnd-kit/core` (add dep). Stage change writes `recruiter_activity` + updates `last_stage_change_at`. Reject column requires a reason.

**Candidate profile** sections per spec; actions: move stage, schedule interview, download resume, reject.

---

## 5. Interviews

`/employer/interviews` — list + simple month calendar (lightweight, no external lib; reuse shadcn `Calendar`). Schedule from a candidate profile via a Sheet (date/time, duration, mode, link/location). Notes + rating editable inline; status transitions logged to activity feed.

---

## 6. Analytics

`/employer/analytics` powered by one server fn that runs aggregate SQL scoped to the caller's company:
- Total applicants, Applications per job, Avg ATS score, Time-to-hire (avg days from `applied_at` to first `hired` stage change), Source breakdown, Top performing jobs, Funnel conversion (% moving stage→stage).
- Charts via existing `recharts` (already in `ui/chart.tsx`). CSV export button using a small client-side serializer.

---

## 7. Plans & soft limits

`employer_plan` lookup in code (no DB table needed yet):
- `starter`: 3 active jobs, 100 applicants per job.
- `growth`: 10 active jobs, unlimited applicants.
- `enterprise`: unlimited.

Enforced server-side in `createEmployerJob` and `publishEmployerJob` (block transition to `active` when cap reached) with friendly toast. `/employer/settings/plan` shows usage bars and a "Contact sales" CTA (no checkout).

---

## 8. Team & invites

- `/employer/team`: admin invites by email + role. Creates `company_invites` row, sends email via existing transactional pipeline (template `employer-invite`).
- Invite link → `/employer/invite/$token` accepts, creates `company_members` row for current user, redirects to dashboard. If signed-out, route stores token and redirects through `/auth`.

---

## 9. Design

Inherits existing Career Boost dark-bold tokens. Employer area gets:
- New "Employer Portal" pill in the navbar when the user has any company membership; switcher for users in multiple companies.
- Dashboard widget cards reuse `Card` + `bg-card-gradient`; numeric KPIs use `font-display`.
- Pipeline columns: subtle stage color accents (using existing semantic tokens, no new hex).
- Empty states for every list (jobs, applicants, interviews) so the portal feels alive pre-data.

---

## 10. Technical details

**New deps**: `@dnd-kit/core`, `@dnd-kit/sortable`.

**New files** (high level):
- `supabase/migrations/<ts>_employer_portal.sql` (single migration — all enums, tables, helpers, policies, rename of existing `job_applications` → `seeker_job_tracker`).
- `src/lib/employer/*.functions.ts`: `companies.functions.ts`, `members.functions.ts`, `employer-jobs.functions.ts`, `applications.functions.ts`, `ats.functions.ts`, `interviews.functions.ts`, `analytics.functions.ts`, `plan.ts` (constants + cap helpers).
- `src/lib/employer/ats.server.ts` (prompt + Gemini call).
- `src/routes/_authenticated/employer/route.tsx` (company-membership gate + sidebar layout).
- Route files for each page listed in section 1.
- `src/components/employer/`: `employer-sidebar.tsx`, `kpi-card.tsx`, `activity-feed.tsx`, `job-form.tsx`, `pipeline-board.tsx`, `pipeline-column.tsx`, `applicant-card.tsx`, `score-breakdown.tsx`, `interview-sheet.tsx`, `analytics-charts.tsx`, `team-table.tsx`, `invite-dialog.tsx`, `plan-usage.tsx`, `empty-state.tsx`.
- Add `employer-invite` email template via the scaffolded auth/transactional infra.

**Code path changes**:
- Job marketplace (`src/lib/jobs.functions.ts`) gains an `internal` source that merges employer-published jobs into search results.
- `routeTree.gen.ts` regenerates automatically.
- Existing seeker tracker code updated to `seeker_job_tracker` table name.

**Build order**
1. Migration (rename + new schema + RLS).
2. Server functions + plan helpers.
3. Employer layout, dashboard, jobs CRUD.
4. Application submission + ATS scoring.
5. Kanban + candidate profile.
6. Interviews.
7. Analytics.
8. Team/invites + plan usage page.
9. Marketplace integration + nav switcher.
10. Empty states, polish, smoke test via Playwright.

---

## Open items I'll assume unless you say otherwise

- Email invites use the existing Lovable email infrastructure (no new provider).
- Resumes are stored in the existing `resumes` storage bucket (path-scoped per user).
- Currency defaults to `USD`; salary fields optional.
- One user can belong to multiple companies; UI shows a company switcher when >1.

Approve and I'll build it in the order above.
