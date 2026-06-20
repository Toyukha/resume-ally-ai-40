## Add Adzuna as a secondary global jobs provider

Extend the Jobs Marketplace to fetch listings from Adzuna alongside Arbeitnow, giving users access to global, location-aware results.

### Secrets

Store the Adzuna credentials securely (not in code). I'll request them via `add_secret`:
- `ADZUNA_APP_ID`
- `ADZUNA_API_KEY`

(You've shared them in chat — I'll re-collect them through the secure secret prompt and you can paste them there. Please rotate the key in your Adzuna dashboard afterward since it was sent in plaintext.)

### Backend (`src/lib/jobs.functions.ts`)

1. Add `fetchAdzunaPage(country, page, filters)` — calls `https://api.adzuna.com/v1/api/jobs/{country}/search/{page}` with `app_id`, `app_key`, `what`, `where`, `results_per_page=50`, optional `full_time`/`part_time`/`contract`, and `max_days_old`. Normalize to the existing `NormalizedJob` shape with `provider: "adzuna"`.
2. Extend `NormalizedJob["provider"]` union to `"arbeitnow" | "adzuna"`.
3. Add `country` (ISO-2, default `gb`; user-selectable) to `SearchSchema`. Map a small allowlist (`gb, us, de, fr, nl, ca, au, in, za, br, pl, it, es, sg, nz, mx, at, ch, be`) — Adzuna's supported countries.
4. In `searchJobs`, run Arbeitnow + Adzuna in parallel, merge, de-dup by `${provider}:${externalId}`, then `applyFilters` client-side as today. Same 10-min cache, keyed per provider/country/page/query.
5. Update `getJob` to dispatch by provider prefix on the slug (Adzuna slugs prefixed `adzuna:<id>`).
6. Update `recommendJobs` to also pull a couple Adzuna pages for the user's profile country.
7. Graceful failure: if Adzuna throws (rate-limit, bad key), log server-side and return Arbeitnow-only results — never break search.

### Frontend

- `src/components/jobs/job-filters.tsx` — add a **Country** select (ISO-2 list above, defaults to user's profile country or `gb`). Wire into the existing filter state.
- `src/components/jobs/job-card.tsx` — small provider badge (`Arbeitnow` / `Adzuna`) next to the company name.
- No other UI changes; saved jobs, tracker, match analysis, recommendations, and dashboard widgets work unchanged because everything flows through `NormalizedJob`.

### Out of scope

- Per-country salary normalization (Adzuna returns local currency — shown as-is for now).
- Adzuna's `categories` endpoint for an Industry dropdown (current free-text industry filter still works).

### Technical notes

- Adzuna free tier: 250 calls/month/app — the 10-min in-memory cache + parallel page-1/page-2 fetch keeps us well under that for typical use.
- Keys read inside `.handler()` (never at module scope) so secret injection works.
- No DB migration needed — `saved_jobs.provider` is already free-form text.