## Goal
Make the dashboard show the user’s real active subscription tier immediately after payment, refresh, and normal page loads.

## What I found
- The live record for `opeyemioyeyemi00@gmail.com` is already correct in the backend: `plan=pro`, `plan_tier=pro_1`, valid expiry, latest successful payment `₦5,000`.
- The screenshot shows two conflicting truths at once:
  - toast: “Your subscription is already up to date.”
  - dashboard badge: “Free plan · 1/1 analyses used this month”
- That points to a **dashboard read/sync issue**, not a payment activation issue.

## Plan
1. **Make the dashboard use one authoritative subscription source**
   - Update the plan-read server function so it derives the effective tier from the latest verified payment + current profile in one place.
   - Keep the intended mapping intact:
     - `₦5,000` → `pro_1`
     - `₦10,000` → `pro_2`
   - Return a fully resolved dashboard shape so the UI never has to guess.

2. **Stop silently falling back to Free on read gaps**
   - Remove the misleading “default to free” behavior when the plan query is loading, stale, or errors.
   - Show a proper loading/error state for the subscription badge instead of rendering Free prematurely.

3. **Make refresh update the dashboard immediately**
   - After `refreshSubscriptionStatus`, write the returned reconciled plan directly into the query cache/state instead of relying only on a follow-up refetch.
   - Then run a background refetch for confirmation.

4. **Align callback, recovery, and dashboard behavior**
   - Ensure successful payment verification, “Fix my plan”, and dashboard refresh all feed the same normalized plan shape.
   - Prevent one path from saying “up to date” while another still renders Free.

5. **Add targeted diagnostics for future stuck cases**
   - Add lightweight server logging around the dashboard plan read so if a user still sees Free, we can tell whether it was a read failure, stale cache, or profile/payment mismatch.

6. **Validate both paid tiers end-to-end**
   - Confirm dashboard rendering for:
     - Pro Plan 1 (`₦5,000`)
     - Pro Plan 2 (`₦10,000`)
   - Verify the dashboard always shows the user’s current active plan after payment, refresh, and direct reload.

## Technical details
- Files to update:
  - `src/lib/analyze.functions.ts`
  - `src/lib/flutterwave.functions.ts`
  - `src/routes/_authenticated/dashboard.tsx`
  - possibly `src/routes/_authenticated/payment-callback.tsx` only if needed to normalize the returned plan payload
- Likely root cause:
  - the refresh path and the dashboard read path are not behaving as one authoritative source, and the dashboard currently masks read problems by defaulting to Free.
- Validation target:
  - `opeyemioyeyemi00@gmail.com` should render `Pro Plan 1` on dashboard, not `Free plan`.