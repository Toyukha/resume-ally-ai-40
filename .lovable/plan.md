## What I found

- **Opeyemi is already Pro Plan 1 in live production now.**
  - Profile: `plan=pro`, `plan_tier=pro_1`
  - Expiry: **2026-07-09 09:49:31 UTC**
- The original payment for `GTJ-pro_1-a199fd89-1780996317211` was marked successful at **09:13 UTC**, but the profile did not reflect the upgrade during the callback window.
- A later admin reconciliation repaired that account at **09:49 UTC**.
- Production logs show the activation path succeeded server-side for that transaction, but the user-facing callback flow still timed out earlier.

## Why the dashboard showed Free

Most likely one of these live-production conditions caused it:

1. **The profile was still actually free during the first callback window** even though the payment row was already marked successful.
2. **The dashboard was reading before the repair landed** and therefore correctly showed Free at that moment.
3. **There is still activation drift in live production** for at least one successful Pro 1 payment, meaning the activation system is not yet fully reliable.

## Live production verification result

### Pro Plan 1
- Successful payments checked in the last 14 days: **3**
- Successful payments whose profile does **not** match the paid tier: **1**

### Pro Plan 2
- Successful payments checked in the last 14 days: **2**
- Successful payments whose profile does **not** match the paid tier: **0**

## Remaining live issue

There is still **one live Pro Plan 1 mismatch** in production:
- User: `98da6986-f4e9-43bc-8f83-445b705f05ea`
- Payment: `GTJ-pro_1-98da6986-1780828735255`
- Paid tier: `pro_1`
- Current profile tier: `pro_2`

This means **Pro Plan 2 activation looks healthy**, while **Pro Plan 1 still has at least one live inconsistency** that should be reconciled and then prevented going forward.

## Implementation plan

1. **Reconcile the remaining live mismatch**
   - Repair the mismatched successful Pro 1 payment so the profile matches the paid tier.
   - Write an activation event entry for auditability.

2. **Harden live production activation verification**
   - Re-check the callback verification path so a successful payment cannot remain marked successful while the profile stays on the wrong plan.
   - Treat mismatched plan tier as a recoverable activation failure and re-run activation automatically.

3. **Make dashboard plan refresh more deterministic after checkout**
   - Ensure the dashboard re-fetches the latest plan state immediately after return from payment callback and after any activation recovery.
   - Confirm there is no stale cached plan surviving the redirect.

4. **Add a production-safe validation pass for both plans**
   - Validate Pro 1 and Pro 2 upgrade flows against live records by checking:
     - payment marked successful
     - profile plan matches paid tier
     - expiry is present and in the future
     - activation event trail exists

5. **Report exact root cause once code and data are aligned**
   - After the repair, re-check recent live payments and confirm whether the issue was:
     - callback-only timing,
     - activation drift,
     - or stale dashboard state.

## Technical details

- The dashboard reads plan state from `getUserPlan`, which pulls directly from `profiles` and computes effective plan from `pro_expires_at`.
- Since Opeyemi’s live `profiles` row is now correct, any continued Free display would point to **stale client state or pre-repair timing**, not the current stored plan.
- The production dataset still shows a **Pro 1-only mismatch pattern**, so that tier needs one more pass in live reconciliation and validation.

## Expected outcome

- Opeyemi’s dashboard consistently shows **Pro Plan 1**.
- All recent successful Pro 1 and Pro 2 payments in live production match the profile tier.
- Future successful Flutterwave payments activate independently of browser timing and are visible on the dashboard immediately after return.