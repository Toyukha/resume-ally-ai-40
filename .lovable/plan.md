## What I’ll fix

I verified the live record for `opeyemioyeyemi00@gmail.com`: the latest payment is `₦5,000`, marked successful, and the profile is already `pro / pro_1` with a valid expiry. I also found a live activation log showing the plan update completed successfully. That means the main problem is the app’s confirmation/sync flow, not the payment itself.

## Plan

1. **Make dashboard plan reads authoritative**
   - Update the server-side plan read used by the dashboard so it can reconcile from the user’s **latest successful payment** before returning plan data.
   - Ensure the returned dashboard tier reflects the user’s **current plan**, not an older or stale state.
   - Preserve the intended mapping:
     - `₦5,000` → **Pro Plan 1**
     - `₦10,000` → **Pro Plan 2**

2. **Fix the payment callback confirmation flow**
   - Adjust the callback page so it does not show the “We couldn’t confirm your upgrade” timeout when the backend has already verified and activated the plan.
   - Use the successful verification/recovery result as the primary signal, then revalidate the dashboard state in the background.
   - Keep the retry path only for true unresolved cases.

3. **Fix “Fix my plan” and dashboard refresh behavior**
   - Strengthen the recovery/refresh server functions so they return the fully reconciled plan state after activation.
   - Update the dashboard query handling so the UI refreshes immediately after recovery and does not continue displaying Free when the reconciled state is Pro.
   - Add proper loading/error handling instead of silently defaulting to Free during sync gaps.

4. **Validate both paid tiers end-to-end**
   - Verify the final behavior for:
     - **Pro Plan 1** (`₦5,000`)
     - **Pro Plan 2** (`₦10,000`)
   - Confirm the dashboard always shows the user’s **current active plan** after successful payment, retry, or manual refresh.

## Technical details

- Likely code paths involved:
  - `src/lib/analyze.functions.ts` (`getUserPlan`)
  - `src/lib/flutterwave.functions.ts` (verify, recover, refresh)
  - `src/routes/_authenticated/payment-callback.tsx`
  - `src/routes/_authenticated/dashboard.tsx`
- I’ll keep the existing payment model and tighten the sync/reconciliation logic only where the incorrect UI state is being produced.