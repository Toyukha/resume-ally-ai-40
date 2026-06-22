## Advanced Job Search & Smart Filtering

A big upgrade to the Jobs Marketplace plus homepage discovery sections. I'll break it into focused, shippable phases so we can review each before moving on.

### Phase 1 — Smart Filter Sidebar + Search + Sort (core UX)
Rebuild `/jobs` (Browse) with a left filter sidebar (sticky on desktop, drawer on mobile) and a results panel.

Filters:
- **Country** (US, UK, Canada, Germany, Netherlands, France, Australia, Nigeria, Ghana, Kenya, South Africa, Other)
- **Work type** (Remote, Hybrid, Onsite) — multi-select
- **Job category** (19 categories listed) — multi-select, mapped to keyword groups
- **Experience level** (Entry, Junior, Mid, Senior, Lead, Executive) — keyword-derived
- **Employment type** (Full-time, Part-time, Contract, Internship, Freelance) — multi-select
- **Intelligent search bar** — searches title/company/skill/keyword (already wired via Adzuna `what`)
- **Sort**: Most Relevant (default), Newest, Highest Match, Recently Posted, Remote First, Company A-Z
- **Active filter chips** above results with one-click clear; "Clear all"

All state lives in URL search params (TanStack `validateSearch`) so filters are shareable/bookmarkable.

### Phase 2 — Quick Filter Cards
Horizontal scrollable row of one-click preset cards above results: 🌍 Remote, 🇬🇧 UK, 🇺🇸 US, 🇨🇦 Canada, 🇳🇬 Nigeria, 💼 Customer Success, 📊 Data Analyst, 🎨 UI/UX, 💻 Software Engineering, 📈 Marketing, 🎯 Sales. Each card applies the appropriate filter set.

### Phase 3 — Country Job Hub pages
New routes under `_authenticated/jobs/`:
- `/jobs/country/$country` — dynamic page handling `uk`, `us`, `canada`, `nigeria`, `germany`, `remote`, etc.
- Each renders the same results UI pre-filtered, with a localized hero ("Jobs in the United Kingdom") and per-country SEO `head()` metadata.
- New "Countries" tab in `JobsTabs`.

### Phase 4 — Result Card upgrades + Match Score badge
Job cards already show title/company/location/type/badges/posted. I'll add:
- Country flag/code badge
- Inline **Match Score** badge (computed on-the-fly from CV keywords vs job tags/title; no quota cost — purely client-side keyword overlap, distinct from the quota-consuming "Analyze Match" deep AI run)
- Cleaner layout, same Analyze/Save/Apply actions

### Phase 5 — Live Job Statistics strip
A small stats bar at the top of `/jobs`: "10,500+ Remote · 3,200 UK · 5,400 US · 2,100 Customer Success". Numbers pulled from cached Adzuna `count` endpoint per filter (5-min cache) — real, not hardcoded.

### Phase 6 — Homepage discovery sections
On `/` (between hero and existing sections):
- **Trending Countries**: 🇨🇦 Canada · 🇬🇧 UK · 🇺🇸 USA · 🇩🇪 Germany · 🌍 Remote — clickable cards linking to country hub pages
- **Popular Career Paths**: 💼 Customer Success · 📊 Data Analytics · 💻 Software Engineering · 🎨 UI/UX · 📈 Digital Marketing · 🎯 Sales — clickable cards linking to `/jobs?category=...`

### Phase 7 — Save Filters / Saved Searches *(deferred — confirm before building)*
Requires a new DB table (`saved_searches`) and an email notification job. I'll skip this in the first pass and add it as a follow-up once the rest is approved, to keep this PR reviewable.

### Personalized Recommendations
The existing `/jobs/recommendations` tab already does this (uses CV keywords). I'll polish it to show match % chips and link the "Recommended For You" section more prominently from the dashboard.

### Technical notes
- All filter state via URL params + `zodValidator` (shareable, SSR-safe)
- Category → keyword mapping lives in a new `src/lib/job-categories.ts`
- Country → Adzuna country code + display label in `src/lib/job-countries.ts`
- Experience-level filtering done client-side via title regex (Adzuna doesn't expose it directly)
- Mobile: sidebar collapses into a Sheet drawer triggered by a "Filters" button
- No backend schema changes in phases 1-6

### Out of scope this pass
- Saved searches table + email alerts (Phase 7, separate approval)
- Match-score badge that consumes user quota (kept as separate "Analyze Match" CTA — unchanged)

Want me to ship phases 1-6 in one go, or stage them? And should I include Phase 7 (saved searches with notifications) now or later?