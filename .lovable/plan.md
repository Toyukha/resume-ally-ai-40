## What's actually happening

The Jobs Marketplace blends results from **four** providers:

| Provider | Country aware? |
|---|---|
| Adzuna | Yes — accepts a country code (`ca`, `gb`, `de`…) |
| Arbeitnow | No — mostly Germany jobs, no country param |
| Himalayas | No — global remote feed |
| RemoteJobs.org | No — global remote feed |

In `src/lib/jobs.functions.ts → searchJobs`, all four are merged via round-robin into the same result set, and `applyFilters` only enforces a location match when `filters.location` is a non-empty string.

That produces the two bugs you're seeing:

### 1. `/jobs/country/canada` shows Germany roles
`COUNTRIES` (`src/lib/job-countries.ts:27`) gives Canada `adzuna: "ca"` but **no `locationKeyword`**. So:
- Adzuna correctly returns Canadian jobs.
- Arbeitnow/Himalayas/RemoteJobs return their normal global mix (Arbeitnow is ~90% German), and nothing filters them out.
- Round-robin interleave puts ~3 non-Canadian jobs for every 1 Canadian job at the top of the page.

The same bug silently affects every Adzuna-covered country (US, UK, Germany happens to look "correct", Netherlands, France, Australia, South Africa).

### 2. `/jobs/country/nigeria` is empty
Nigeria has `adzuna: "gb"` + `locationKeyword: "nigeria"` (Adzuna has no Nigeria endpoint). So:
- Adzuna returns UK jobs.
- `applyFilters` then drops every job whose `location` doesn't contain "nigeria" — which is essentially all of them.
- Result: 0 jobs. Same for Ghana and Kenya.

I verified upstream feeds are healthy (Arbeitnow 200/100 jobs, Himalayas 200/89,150 total, RemoteJobs 200, Adzuna creds set) — this is purely a filtering / provider-selection bug on our side.

## Fix

Make provider selection country-aware inside `searchJobs`:

1. **Country profile helper** — derive per-country fetch strategy from `COUNTRIES`:
   - Adzuna-covered country (US, UK, Canada, Germany, Netherlands, France, Australia, South Africa): query **Adzuna only** for that country code. Skip Arbeitnow (it's a Germany-skewed feed and pollutes other countries); keep Himalayas + RemoteJobs only when the user explicitly asks for remote (workTypes includes "remote") so remote-friendly Canadian/US/etc. roles still surface.
   - Germany page: keep Arbeitnow (it's actually relevant there).
   - Non-Adzuna country (Nigeria, Ghana, Kenya): query Himalayas and RemoteJobs with the country name as the search query (e.g. `q="nigeria"`) plus Adzuna `gb` with `where="nigeria"`; then post-filter by `locationKeyword` as today. This actually surfaces the small but real pool of Nigeria-based remote roles those feeds carry.
   - Remote (Global): keep all global feeds (current behaviour), unchanged.

2. **Tighten `applyFilters` for country pages** — when a country is selected and it's Adzuna-covered, also drop any non-Adzuna result whose `location` clearly belongs to a different country (e.g. contains "germany"/"berlin"/"münchen" on the Canada page). Cheap allow-list per country derived from `COUNTRIES` labels + a small alias map (e.g. `canada → ["canada", "toronto", "vancouver", "montreal", "ontario", "quebec", "alberta", "bc "]`).

3. **Empty-state copy for Nigeria/Ghana/Kenya** — if after step 2 the result set is still empty, show a friendlier message in `src/routes/_authenticated/jobs.country.$country.tsx` ("Limited live coverage for {country}. Try Remote Worldwide for {country}-friendly roles.") with a button linking to `/jobs/country/remote`.

4. **Sanity check** — after the change, hit `/jobs/country/canada` (expect Canadian cities in `location`), `/jobs/country/germany` (expect German cities, Arbeitnow back in the mix), and `/jobs/country/nigeria` (expect either Nigeria-tagged remote roles or the new empty state, not a blank list).

## Files I'll touch

- `src/lib/jobs.functions.ts` — add country profile + per-provider gating inside `searchJobs`; extend `applyFilters` with the country allow-list.
- `src/lib/job-countries.ts` — add a small `cityAliases?: string[]` field per entry to power the allow-list.
- `src/routes/_authenticated/jobs.country.$country.tsx` — refine the empty state for non-Adzuna countries.

No schema or auth changes; no new dependencies.
