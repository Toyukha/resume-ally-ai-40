# Fix: Admin dashboard doesn't fully load on first visit

## What's happening

The `/admin` overview calls one server function (`getPlatformStats`) that fans out **12 parallel queries** against `profiles`, `analyses`, and `payments` — including two unbounded 30-day row scans for the trend chart. In production this regularly:

- exceeds the worker's request budget on the first hit (cold start + parallel scans), so the promise rejects or returns a partial payload
- is not retried — `useQuery` here uses defaults but the first failure leaves the page stuck on "Loading platform statistics…" until the admin hits refresh, which usually warms the cache and succeeds

Two smaller contributors:
- `AdminLayout` runs its own `getAdminMe` query with `staleTime: 0, gcTime: 0` in addition to the route gate, so the overview kicks off three round-trips before any data renders.
- The trend queries pull every row in the window and count client-side instead of using `count: "exact", head: true` per bucket — fine for small tenants, brittle as the table grows.

## Fix

### 1. Make `getPlatformStats` cheaper and more resilient (`src/lib/admin.functions.ts`)
- Replace the two `select("created_at")` 30-day scans with a single `rpc`-free aggregation: keep one query per table but only select `created_at`, and cap with `.limit(50000)` defensively. (Real aggregation via SQL view is a follow-up; this just stops the scans from ballooning.)
- Wrap the `Promise.all` in `Promise.allSettled` and fall back to `0` / `[]` for any rejected leg so the dashboard always returns a complete shape instead of throwing the whole request away when one count times out.
- Log which leg failed (server-only) so we can tighten the slow ones later.

### 2. Make the client recover automatically (`src/routes/admin/index.tsx`)
- On the `useQuery` for `admin-stats`: add `retry: 2`, `retryDelay: attempt => Math.min(1000 * 2 ** attempt, 4000)`, and `refetchOnWindowFocus: false`.
- Replace the single "Loading…" gate with a skeleton grid so partial slowness is visible but the layout doesn't collapse, and the query continues in the background.
- Add a small "Retry" button shown only when `isError` so an admin can recover without a full page refresh.

### 3. Stop the duplicate admin-me round-trip (`src/components/admin-layout.tsx`)
- Reuse the same `["admin-me"]` query the route gate already populated: drop `staleTime: 0, gcTime: 0` here (the gate in `src/routes/admin/route.tsx` already enforces freshness on entry) so the layout uses the cached value instead of re-fetching on every child route.

## Out of scope
- No schema changes, no new tables, no migration.
- No change to `getAdminMe` / auth gate behaviour.
- Per-sub-page widgets (`/admin/revenue`, `/admin/analyses`, etc.) are unchanged.

## Files touched
- `src/lib/admin.functions.ts` — `getPlatformStats` only
- `src/routes/admin/index.tsx` — query options + skeleton + retry button
- `src/components/admin-layout.tsx` — drop forced refetch on `admin-me`
