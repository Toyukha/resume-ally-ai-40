## Make all four providers visible + add pagination

### Root cause
`searchJobs` fetches Arbeitnow, Adzuna, Himalayas, RemoteJobs in parallel and merges them, but then slices to 50 results. Arbeitnow returns 50 jobs first in the merge order, so the slice cuts off everything else — the UI only ever sees Arbeitnow. There's also no pagination control on the jobs page, so users can't browse deeper.

### Backend — `src/lib/jobs.functions.ts`

1. **Interleave providers before slicing** so the first page shows a mix from all four sources. Round-robin: take 1 from Arbeitnow, 1 from Adzuna, 1 from Himalayas, 1 from RemoteJobs, repeat until 50. De-dupe by `${provider}:${id}` as today.
2. **Return pagination metadata**: `{ jobs, total, page, hasMore }` where `hasMore` = `filtered.length > page * 50` OR any provider returned a full page (signal more available upstream).
3. Keep the existing `page` input (already in `SearchSchema`, max 10). No other behaviour changes.

### Frontend — `src/routes/_authenticated/jobs.index.tsx`

1. Add local `page` state (default 1). Include `page` in the `JobSearchInput` passed to `searchJobs` and in the query key.
2. Reset `page` to 1 whenever filter values change (other than `page` itself).
3. Render Prev / Next buttons below the results grid:
   - **Prev** disabled when `page === 1`
   - **Next** disabled when `!hasMore` or `page >= 10` (Adzuna/server cap)
   - Show "Page N" between them
   - Scroll to top of list on page change

### Out of scope
- Per-provider page cursors (each provider has its own pagination depth; we advance them in lockstep, which is the existing pattern).
- Infinite scroll — explicit Prev/Next is simpler and matches the request ("progress to see other listed jobs").
- Saved/Recommendations tabs — only Browse Jobs is affected.