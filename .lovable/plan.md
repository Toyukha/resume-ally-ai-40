Three deliverables on top of the current build. Scoped to keep changes additive and behind small, reversible steps.

## 1. PDF / source-file storage bucket

Currently the dashboard extracts text in the browser and only stores `resume_text` in the `analyses` table — the original file is never persisted. This adds optional original-file storage so users can re-download their CV and (later) so we can drop oversized `resume_text` rows.

- New private bucket `resumes` (RLS: users can only read/write under `{userId}/...`; service_role full access).
- Add `resume_storage_path TEXT` column to `analyses`.
- On dashboard submit, after a successful extract, upload the original file to `resumes/{userId}/{uuid}.{ext}` (best-effort — failure does not block analysis).
- New server fn `getResumeDownloadUrl(analysisId)` returns a 60s signed URL; surface a "Download original" link on the analysis detail.

## 2. Queued AI analysis jobs

Replace the synchronous `analyzeResume` round trip with a job queue so big analyses don't block the request and don't time out on the worker.

- New table `analysis_jobs(id, user_id, status [pending|processing|completed|failed], resume_text, job_description, resume_filename, resume_storage_path, analysis_id, error, attempts, created_at, started_at, completed_at)`.
- `enqueueAnalysis` server fn: validates input, checks plan/quota (same logic as today), inserts a `pending` row, returns `jobId`. Replaces the dashboard's direct `analyzeResume` call.
- `getJob(jobId)` server fn: polled by the dashboard every 2s; returns status and final `analysisId` when done.
- `/api/public/hooks/process-analysis-jobs` server route: picks the oldest `pending` row, marks it `processing`, runs the existing AI pipeline, writes the `analyses` row, marks the job `completed`. Auth = anon apikey header.
- `pg_cron` every minute to invoke the route (also invokable directly from `enqueueAnalysis` via `pg_net` for instant start; cron is the safety net for retries).
- Dashboard UI: after submit show "Analyzing… (queued)" with a progress indicator; on `completed` load the result via existing `getAnalysis`.
- Keep the legacy `analyzeResume` export as a thin wrapper that enqueues + polls so any external callers still work.

## 3. Usage alerts

Daily check that writes to existing `system_notifications` table when thresholds are crossed; super-admins already see those.

- New SQL function `public.get_capacity_snapshot()` returning DB size, analyses row count, monthly analyses count, active pro users.
- `/api/public/hooks/usage-alerts` server route: reads the snapshot, and if DB size > 400 MB (80% of free tier) or monthly analyses > configurable threshold, inserts a `system_notifications` row of type `capacity_warning` targeted at super-admins.
- `pg_cron` daily at 08:00 UTC.

## Files
- migration: `resumes` bucket policies, `analyses.resume_storage_path`, `analysis_jobs` table + RLS + grants, `get_capacity_snapshot()`, pg_cron schedules.
- `src/lib/resume-storage.functions.ts` — signed URL + upload helpers.
- `src/lib/analyze.functions.ts` — add `enqueueAnalysis`, `getJob`; keep existing flow as internal worker.
- `src/routes/api/public/hooks/process-analysis-jobs.ts` — worker route.
- `src/routes/api/public/hooks/usage-alerts.ts` — alerts route.
- `src/routes/_authenticated/dashboard.tsx` — switch to enqueue + poll, upload PDF to bucket.

No changes to pricing, auth, or billing logic.