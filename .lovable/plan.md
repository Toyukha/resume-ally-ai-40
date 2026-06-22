## Goals

1. Give employers/recruiters a dedicated sign-in entry point that lands them in the Employer Portal (not the job-seeker dashboard).
2. Make the Employer Portal discoverable from the public site, even when signed out.
3. Surface the "Paying from outside Nigeria" card on the home page pricing section (it already exists on `/pricing`, but not on the landing page).

## 1. Employer login page — `/employer/login`

New public route `src/routes/employer.login.tsx` modeled after `src/routes/admin/login.tsx`:

- Branded header ("Employer Portal — Sign in") with a recruiter-style icon.
- Email + password fields, Google sign-in button (uses `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/employer/dashboard" })`).
- "Forgot password" → `resetPasswordForEmail` with `redirectTo /reset-password`.
- "New employer? Create a workspace" link → `/employer/onboarding` (existing route handles company creation after auth).
- On successful sign-in:
  - call `listMyCompanies`
  - if 0 companies → navigate to `/employer/onboarding`
  - else → navigate to `/employer/dashboard`
- If already signed in on mount, same routing logic runs (so visiting `/employer/login` while logged in doesn't dead-end).
- A small note: "Looking for the job seeker sign-in? → /auth".

This fixes "I can't access the employer page": today `/auth` hard-redirects every successful sign-in to `/dashboard`, so employers never reach `/employer/*`. The new page bypasses that.

## 2. Navbar entry point

In `src/components/navbar.tsx`:

- Signed-out state: add a subtle "For Employers" link (desktop nav) that points to `/employer/login`.
- Signed-in state: keep the existing "Employer Portal" pill (already there) — no change.

This is the only navbar change; the seeker sign-in flow stays untouched.

## 3. Home page — outside-Nigeria payment card

In `src/routes/index.tsx`, inside the existing `#pricing` section (around line 132), insert the same callout component used on `/pricing` (lines 116–145): Globe badge ("Paying from outside Nigeria?"), Card icon, "Select 'Card' at checkout…" headline, and the Naira-equivalent note (₦5,000 ≈ $3.67 / ₦10,000 ≈ $7.35).

Placed directly above the three plan cards so visitors see it before they click through to `/pricing`. Styling/copy identical to the pricing page version for consistency.

## Out of scope

- No DB / RLS changes — companies, members, and invites already exist.
- No new server functions — reusing `listMyCompanies`.
- No changes to `/auth` (job seeker flow) or to the admin portal.

## Technical notes

- `/employer/login` is a top-level public route (not under `_authenticated/`), `ssr: false` like `/admin/login`, so the auth check runs in the browser.
- Google OAuth must go through `lovable.auth.signInWithOAuth` per the Lovable Supabase integration rules.
- The page reuses existing UI primitives (`Card`, `Input`, `Label`, `Button`) — no new components needed.
