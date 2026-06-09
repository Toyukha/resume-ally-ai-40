# Fix: paid Pro users not being upgraded

## What's happening today

- The only path that activates Pro is the browser callback at `/payment-callback`, which calls `verifyFlutterwavePayment` and then polls `getUserPlan` for up to 30s.
- For user `opeyemioyeyemi00@gmail.com` (tx_ref `GTJ-pro_1-a199fd89-1780996317211`):
  - Flutterwave returned `status=successful`.
  - The `payments` row was updated to `status=successful, verified_at=09:13:10` — meaning the server reached the line *after* the `activate_pro_plan` RPC call.
  - But no `activation_complete` event was persisted, and the profile stayed on `free` through both 30s polls.
  - Net effect: charge captured, plan not upgraded.
- There is **no Flutterwave webhook** wired up, so if the browser callback fails for any reason (network blip, user closes tab, RPC effect not visible to the user's session, etc.) the upgrade silently never happens.

## Goal

Make plan activation reliable and independent of the user's browser, and self-heal cases where the payment is `successful` but the profile is still `free`.

## Changes

### 1. Add a Flutterwave webhook (server-to-server activation)

New server route: `src/routes/api/public/hooks/flutterwave.ts`.

- Verifies the `verif-hash` header against a new `FLUTTERWAVE_WEBHOOK_HASH` secret (timing-safe compare).
- Re-fetches the transaction from Flutterwave's `/transactions/:id/verify` endpoint (don't trust the webhook payload alone).
- Locates the matching `payments` row by `tx_ref` + amount + currency.
- If valid and not already activated:
  - Calls `activate_pro_plan(user_id, plan_tier, 30)`.
  - Marks `payments.status='successful'` (idempotent — skip if already successful and profile already pro).
  - Persists an `activation_complete` (or `activation_recovered_via_webhook`) event into `payment_activation_events` with `source='webhook'`.
- Always returns 200 after persisting, so Flutterwave doesn't retry storm.

### 2. Make activation idempotent and self-healing on the callback

Update `verifyFlutterwavePayment` in `src/lib/flutterwave.functions.ts`:

- When `payment.status === 'successful'` (the `already_verified` branch today), also re-check the user's profile. If `plan !== 'pro'` or `plan_tier !== payment.plan_tier`, re-run `activate_pro_plan` before returning. This fixes users whose payment row says "successful" but whose profile somehow didn't get the upgrade (exactly the case we just saw).
- After `activate_pro_plan`, do a `SELECT plan, plan_tier, pro_expires_at FROM profiles WHERE id = userId` and include it in the log payload + the returned response. If the read-back still shows `free`, persist a new terminal event `activation_no_effect` with the before/after snapshot so we never again have a silent "RPC returned OK but profile didn't change".

### 3. Recovery action from the timeout screen

`src/routes/_authenticated/payment-callback.tsx`:

- On timeout, instead of asking the user to reload, call a new `recoverActivation` server fn that:
  - Looks up the payment by `tx_ref + user_id`.
  - If `status='successful'`, re-runs `activate_pro_plan` and returns the fresh profile.
  - If still pending, re-calls verify with the transaction id.
- Show a "Fix my plan" button that calls it and transitions to success on resolution.

### 4. Admin reconciliation tool

New server fn `reconcileStuckActivations` (admin-only) + a button on `src/routes/admin/activations.tsx`:

- Finds `payments` rows with `status='successful'` in the last 7 days whose owning profile is not `pro` or has the wrong `plan_tier`.
- Runs `activate_pro_plan` for each and logs an `activation_recovered_by_admin` event.
- Lets you one-click fix this specific user right now (and any future stragglers) without manual SQL.

### 5. Fix this user immediately

Migration step (one-shot, in the same migration that adds the event-type label) — re-run the RPC for the affected payment so his plan reflects what he actually paid for:

```sql
SELECT public.activate_pro_plan('a199fd89-ac87-42c4-9f89-8ff66b634545', 'pro_1', 30);
INSERT INTO public.payment_activation_events (event, success, user_id, tx_ref, plan_tier, metadata)
VALUES ('activation_recovered_by_admin', true, 'a199fd89-ac87-42c4-9f89-8ff66b634545',
        'GTJ-pro_1-a199fd89-1780996317211', 'pro_1',
        jsonb_build_object('source','manual_repair','reason','callback_timeout_without_profile_update'));
```

(He was manually bumped to `pro_2` at 09:21 — confirm with you whether to set him back to the `pro_1` he actually paid for, or leave the goodwill upgrade in place. See question below.)

## Secrets / config required

- `FLUTTERWAVE_WEBHOOK_HASH` — the "Secret hash" you set in the Flutterwave dashboard's webhook section. We'll prompt you to add this once the webhook route is in place.
- Webhook URL to configure in Flutterwave dashboard: `https://www.thecareerboost.com/api/public/hooks/flutterwave`.

## Why this fixes the root cause

Even if we never figure out exactly why the browser-side poll didn't see the `pro` row in this one case, the webhook path runs entirely on Flutterwave's schedule (with retries) and the `already_verified` branch now actively repairs profile drift. So a paid user gets upgraded whether or not their browser ever returns to `/payment-callback`.

## Open question

For the affected user `opeyemioyeyemi00@gmail.com`: he paid for **Pro Plan 1** but was manually bumped to **Pro Plan 2** at 09:21. Do you want me to:

- (a) leave him on Pro Plan 2 as goodwill, or
- (b) correct him to Pro Plan 1 (what he actually paid for)?
