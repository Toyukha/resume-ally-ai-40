## Problem

After creating a company in `/employer/onboarding`, the user lands on `/employer/dashboard` and sees:

> Something went wrong — useEmployerCtx must be used inside the employer layout

### Root cause

In `src/routes/_authenticated/employer.tsx`, the layout reads companies via `useQuery({ queryKey: ["my-companies"] })`. When the user first visits onboarding, that query is fetched and cached as `[]` (no companies yet).

After `createCompany` succeeds, `employer.onboarding.tsx` calls `navigate({ to: "/employer/dashboard" })` but **never invalidates** the `["my-companies"]` cache. So the dashboard mounts with the stale empty array. The layout then runs:

```ts
if (!companies || companies.length === 0) {
  if (!pathname.startsWith("/employer/onboarding") ...) {
    throw redirect({ to: "/employer/onboarding" }); // thrown in render → caught by error boundary
  }
  return <Outlet />; // no Provider wrapping
}
```

`throw redirect()` only works in `beforeLoad`/`loader`. Thrown from a component body it bubbles to the error boundary, and depending on render order the dashboard child can mount (without the Provider), producing the `useEmployerCtx` error.

## Fix

Two narrow changes in frontend layout/onboarding code — no DB, no schema, no business logic changes.

### 1. `src/routes/_authenticated/employer.onboarding.tsx`
- Grab `queryClient` via `useQueryClient()`.
- In `onSuccess` of the create mutation: `await queryClient.invalidateQueries({ queryKey: ["my-companies"] })` **before** calling `navigate({ to: "/employer/dashboard" })`. This guarantees the layout sees the new company.

### 2. `src/routes/_authenticated/employer.tsx`
Make the layout robust even if cache is briefly stale:
- Replace the in-render `throw redirect(...)` with a `useEffect` that calls `navigate({ to: "/employer/onboarding", replace: true })` when companies are empty and the path isn't already onboarding/invite. While redirecting, render a small "Redirecting…" placeholder instead of an unwrapped `<Outlet />`.
- Keep the existing branch that renders the onboarding/invite outlet without the Provider (those routes don't use `useEmployerCtx`).
- Ensure the `EmployerContext.Provider` wraps `<Outlet />` in **every** path where a child route that uses `useEmployerCtx` could mount.

### 3. Defensive: invalidate on sign-out / company switch (small)
- Already handled implicitly. No extra work needed beyond #1 and #2.

## Files touched

- `src/routes/_authenticated/employer.onboarding.tsx` — add `useQueryClient` + invalidate before navigate.
- `src/routes/_authenticated/employer.tsx` — replace render-time `throw redirect` with `useEffect` navigate; render placeholder instead of bare `<Outlet />` during the redirect.

No new files, no migrations, no package changes.
