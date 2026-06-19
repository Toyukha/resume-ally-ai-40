## Jobs Marketplace — All-in-one build

A new authenticated `/jobs` module powered by the free Arbeitnow API, with saved jobs, application tracker, personalized recommendations, and dashboard widgets — all consistent with the existing navy/gold brand.

### 1. Navigation
- Add **Jobs** link to `src/components/navbar.tsx` (signed-in users only, between Dashboard and account menu).
- Mobile drawer gets the same entry.

### 2. Routes (all under `_authenticated/`)
```
src/routes/_authenticated/jobs.tsx              → layout with sub-tabs (Browse · Saved · Tracker · Recommendations)
src/routes/_authenticated/jobs.index.tsx        → Browse (search + filters + results)
src/routes/_authenticated/jobs.saved.tsx        → Saved/Favorited jobs
src/routes/_authenticated/jobs.tracker.tsx      → Kanban-style Application Tracker
src/routes/_authenticated/jobs.recommendations.tsx → Personalized matches
src/routes/_authenticated/jobs.$jobId.tsx       → Job detail drawer/page with full description + analyze panel
```

### 3. Job API integration (Arbeitnow)
- Server fn `src/lib/jobs.functions.ts`:
  - `searchJobs({ query, location, remote, jobType, page })` → fetches `https://www.arbeitnow.com/api/job-board-api`, normalizes results, applies client filters (Arbeitnow returns tags like `remote`, `full-time`, `internship`).
  - 10-min in-memory cache keyed by query string (cheap, stateless-safe fallback to refetch).
  - `getJob(slug)` for detail view.
- Normalized shape: `{ id, slug, title, company, location, remote, employmentType, postedAt, url, description, tags }`.
- Filters surfaced in UI: search box, location, remote/hybrid/onsite, employment type, tag-based industry, posted-within.
- Adzuna stubbed behind a `providers` array; add later when keys land — no UI change required.

### 4. Match Analysis
- Reuse existing `analyzeResume` infrastructure. New server fn `analyzeJobMatch`:
  - Inputs: `resumeText` (from fresh upload via existing PDF/DOCX extractor in `src/lib/extract-text.ts`) + `jobDescription` (pulled from Arbeitnow).
  - Calls the same Lovable AI Gateway with the existing analysis schema so the same `match_score`, `missing_keywords`, `strengths`, `weaknesses` come back.
  - Persists to `analyses` (so it counts toward monthly quota and shows up in history) **plus** a new `job_matches` row linking analysis → job.
  - Free users still get free-tier schema (locked optimized resume / cover letter) — matches existing rules.
- UI: "Analyze Match" button on every card opens a sheet → upload CV → progress → score ring + keyword chips + strengths/weaknesses. "Apply Now" opens `job.url` in new tab and offers "Track this application".

### 5. Saved jobs & Application Tracker
- New tables (see Technical section).
- Saved view: grid of saved job cards with "Remove", "Analyze", "Apply", "Move to tracker".
- Tracker: columns Saved · Applied · Interview · Assessment · Offer · Rejected. Drag-and-drop via `@dnd-kit/core` (already common in shadcn ecosystem; will install). Each card shows title/company/match score badge if previously analyzed.

### 6. Recommendations
- Server fn `recommendJobs`:
  - Pulls the user's most recent `analyses` row → extracts top keywords (existing `missing_keywords` + naive token frequency on `resume_text`).
  - Builds 2–3 Arbeitnow queries from top skills, dedupes by slug, returns top 12.
  - Lightweight client scoring: keyword overlap × recency boost.
- Empty state if user has no analyses yet → CTA to run one.

### 7. Dashboard widgets
- Update `src/routes/_authenticated/dashboard.tsx` with 4 new cards:
  - **Recommended Jobs** (top 3 with match preview)
  - **Recent Match Scores** (last 5 analyses, ring chart)
  - **Saved Jobs** (count + 3 most recent)
  - **Application Progress** (stacked bar across tracker statuses)

### 8. Design
- Reuse existing tokens (navy `--background`, gold `--primary`, glass cards). New components: `JobCard`, `JobFilters`, `MatchScoreRing`, `TrackerColumn`, `AnalyzeJobSheet`, `JobsTabs`. No new fonts/colors — strictly current brand.
- Loading: skeleton cards. Empty states: branded illustrations from existing assets.

---

### Technical details

**New tables** (one migration, with GRANTs + RLS scoped to `auth.uid()`):

```text
saved_jobs
  user_id, provider, external_id (slug), title, company, location,
  employment_type, remote, posted_at, url, description, tags[], favorited bool
  unique (user_id, provider, external_id)

job_applications
  user_id, saved_job_id (nullable FK), provider, external_id, title, company, url,
  status enum('saved','applied','interview','assessment','offer','rejected'),
  notes, applied_at, last_status_at, sort_order int

job_matches
  user_id, analysis_id FK → analyses, provider, external_id, title, company,
  match_score int
```

All three: `GRANT SELECT,INSERT,UPDATE,DELETE … TO authenticated; GRANT ALL … TO service_role;` then `ENABLE RLS` + `auth.uid() = user_id` policies. `updated_at` trigger via existing `public.update_updated_at_column()`.

**Server functions** (`src/lib/jobs.functions.ts`, all `requireSupabaseAuth` except `searchJobs` which is auth-gated only because route is `_authenticated`):
- `searchJobs`, `getJob` — call Arbeitnow from server (avoids CORS, allows caching).
- `analyzeJobMatch` — wraps existing analyzer, inserts `job_matches` row.
- `saveJob`, `unsaveJob`, `toggleFavorite`, `listSavedJobs`.
- `createApplication`, `updateApplicationStatus`, `deleteApplication`, `listApplications`.
- `recommendJobs`, `getJobsDashboardStats`.

**Packages to install**: `@dnd-kit/core @dnd-kit/sortable` for the tracker. No new fonts.

**Out of scope** (deferrable later): Adzuna provider wiring (stub only), email job alerts, resume re-use from history, AI cover letter per job.

---

Ready to build all of this in one go on approval.