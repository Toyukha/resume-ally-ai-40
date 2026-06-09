## Problem

User `opeyemioyeyemi00@gmail.com` paid ₦5,000 for Pro Plan 1 — the payment row was marked `successful` in the database, but the `profiles.plan` / `plan_tier` / `pro_expires_at` columns never updated, and the dashboard never reflected the upgrade.

Root cause: the `prevent_billing_field_self_update` trigger on `public.profiles` only bypasses billing-field changes when (a) the current role is `service_role`, or (b) `is_admin(auth.uid())` is true. The verify server function uses the service-role admin client, but in our current Supabase setup neither bypass reliably evaluates true for that connection path, so the `UPDATE profiles SET plan='pro', plan_tier=…` inside `verifyFlutterwavePayment` is rejected with "Not allowed to modify billing fields". The payment row update (different table, no trigger) succeeds in parallel, leaving the user in a "paid but still free" state.

Secondary issue: even after a successful verification, the dashboard does not always show the new plan until a hard reload, because the `user-plan` query is only invalidated on the callback page.

## Fix

### 1. Activate plans through a SECURITY DEFINER RPC (migration)
Create `public.activate_pro_plan(_user_id uuid, _plan_tier text, _days int)` as `SECURITY DEFINER` owned by `postgres`. It performs the `profiles` update atomically and is immune to the trigger because the trigger already has an explicit `service_role` / admin bypass and SECURITY DEFINER runs as the function owner. Grant `EXECUTE` to `service_role` only (not `authenticated` or `anon`).

Also harden the trigger so future server-side writes don't hit the same wall: add a bypass when `auth.uid()` IS NULL (i.e. no authenticated user — only reachable from service-role / DB-internal callers).

### 2. Use the RPC from `verifyFlutterwavePayment`
In `src/lib/flutterwave.functions.ts`, replace the direct `supabaseAdmin.from("profiles").update(...)` with `supabaseAdmin.rpc("activate_pro_plan", { _user_id: userId, _plan_tier: payment.plan_tier, _days: 30 })`. Keep the payment-row update as is. Keep both writes, but run the profile RPC FIRST and only mark the payment `successful` if the plan activation succeeded — so we never again end up with a paid-but-not-upgraded user.

### 3. Backfill the affected user
Run a one-off data update setting `opeyemioyeyemi00@gmail.com`'s profile to `plan='pro'`, `plan_tier='pro_1'`, `pro_started_at=2026-06-09 07:39:03Z`, `pro_expires_at = pro_started_at + 30 days`.

### 4. Auto-refresh the dashboard after a successful payment
- In `src/routes/_authenticated/payment-callback.tsx`, after `verify(...)` resolves successfully, poll `getUserPlan` (or re-invalidate + refetch the `user-plan` query) up to ~10× at 1.5s intervals until `plan === 'pro'`, then redirect to `/dashboard`. This handles any residual replication lag.
- In `src/routes/_authenticated/dashboard.tsx`, broaden the existing `user-plan` query to also `refetchInterval` while the tab is focused for the first 30 seconds after mount when `?upgraded=1` is present in the URL (the callback page will append this on redirect). This guarantees the badge/limits flip without a manual reload.

### 5. Verify
- Re-run `verifyFlutterwavePayment` flow in preview (existing successful payment short-circuits via `alreadyVerified`, so testing requires a fresh transaction — not in scope, but logs from the next real payment will confirm).
- Confirm the affected user's profile now shows `plan='pro'`, `plan_tier='pro_1'`, valid `pro_expires_at`.
- Confirm dashboard reflects Pro plan immediately after redirect.

## Files touched
- new migration: `activate_pro_plan` function + trigger hardening + grants
- `src/lib/flutterwave.functions.ts` — call RPC, reorder writes
- `src/routes/_authenticated/payment-callback.tsx` — poll + redirect with `?upgraded=1`
- `src/routes/_authenticated/dashboard.tsx` — short refetch window when `?upgraded=1`
- data fix for `opeyemioyeyemi00@gmail.com`
