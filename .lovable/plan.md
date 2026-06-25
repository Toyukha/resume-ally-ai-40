# Add Free Job Sources: Remote Bundle + Curated Company Boards

Expand `searchJobs` with two new provider groups. No API keys required. Skip Google Careers (no public API, ToS-disallowed).

## Scope

### Group A — Free remote bundle (3 new providers)
Add to `src/lib/jobs.functions.ts` alongside existing Arbeitnow/Adzuna/Himalayas/RemoteJobs:

1. **Remotive** — `https://remotive.com/api/remote-jobs` (free, no key, JSON)
2. **RemoteOK** — `https://remoteok.com/api` (free, no key, JSON; first element is metadata, skip it)
3. **Jobicy** — `https://jobicy.com/api/v2/remote-jobs` (free, no key, JSON)
4. **WeWorkRemotely** — `https://weworkremotely.com/categories/remote-programming-jobs.rss` + sibling category RSS feeds (parse XML server-side)

Each gets its own `fetch<Source>Page()` with 10-min in-memory cache mirroring the existing pattern. New provider type values added to `NormalizedJob.provider` union: `"remotive" | "remoteok" | "jobicy" | "wwr"`.

### Group B — Per-company boards (curated list)
New file `src/lib/job-company-boards.ts` with a curated list:

**African tech (fixes Nigeria/Ghana/Kenya gap):**
- Flutterwave, Paystack, Andela, Kuda, Moniepoint, Interswitch, Carry1st, mPharma, Yellow Card, Chipper Cash, Moove, Jumia

**Global remote-first:**
- GitLab, Automattic, Zapier, Buffer, Doist, Toptal, Deel, Remote.com

Each entry: `{ name, country, boardType: "greenhouse" | "lever" | "ashby", boardToken }`.

New fetchers in `jobs.functions.ts`:
- `fetchGreenhouseBoard(token)` → `https://boards-api.greenhouse.io/v1/boards/{token}/jobs`
- `fetchLeverBoard(token)` → `https://api.lever.co/v0/postings/{token}?mode=json`
- `fetchAshbyBoard(token)` → `https://api.ashbyhq.com/posting-api/job-board/{token}` (public endpoint, no auth needed for posting-api — does NOT need the Ashby connector gateway)

A `fetchAllCompanyBoards(filter)` parallelizes with `Promise.allSettled`, caches 30 min, and tags each job with `provider: "company"` + `company` already populated. Failures of individual companies are swallowed.

### Provider gating updates in `searchJobs`
- **Nigeria/Ghana/Kenya pages** → include African company boards filtered by `country` match + existing global feeds with location keyword. This is the key win for the user's earlier complaint.
- **Remote (Global)** → all remote sources enabled.
- **Other Adzuna countries** → Adzuna stays primary; company boards added when `country` matches.

### Country profile additions in `src/lib/job-countries.ts`
No structural changes — `cityAliases` already filters non-Adzuna jobs through. New providers go through the same `inCountry()` post-filter that's already in place.

## Out of scope (this turn)
- Reed.co.uk, The Muse, Jooble, Findwork — they need API keys + secret setup; can be added in a follow-up.
- Google Careers — skipped per your decision.
- LinkedIn / Indeed / Glassdoor — no usable public API.
- DB persistence of fetched jobs (still live-fetched + cached in memory).

## Technical notes

- All HTTP calls already match the Worker runtime constraints (fetch-only, no Node-native deps).
- WeWorkRemotely RSS will use a tiny regex-based XML parser (no `xml2js` dep — keeps bundle slim and Worker-safe).
- Round-robin interleave in `searchJobs` extends to the new providers so no single source dominates page 1.
- Existing `applyFilters` + `inCountry` post-filter handle all new providers without changes — they all produce the same `NormalizedJob` shape.
- Typecheck-clean: only the `provider` union widens.

## Files touched

```
src/lib/jobs.functions.ts          (+4 remote fetchers, +3 board fetchers, gating updates)
src/lib/job-company-boards.ts      (NEW — curated company list)
src/lib/job-countries.ts           (minor — no structural change expected)
```

No DB migrations, no new secrets, no UI changes.
