## Goal
Give Free users the same features as Pro Plan 1, and raise their monthly analysis limit from 1 to 3.

## Changes

### 1. `src/lib/plans.ts` — single source of truth
- `PLANS.free.monthlyLimit`: `1` → `3`
- `PLANS.free.features`: replace with the full Pro feature set, scaled to 3:
  - "Run 3 CV Analyses"
  - "ATS Score"
  - "3 Optimized Cover Letters"
  - "CV Strength & Weakness Analysis"
  - "Missing Keyword Recommendations"
  - "3 Optimized CV Generations"
- `PLANS.free.notIncluded`: remove (all Pro features now included)
- `PLANS.free.subtitle`: update to reflect the richer offering (e.g. "Try the full toolkit, on us.")

Because `getMonthlyLimit()` and the pricing UI both read from this file, the dashboard usage cap, pricing cards, and feature checklist all update automatically.

### 2. `src/routes/pricing.tsx` — comparison table
Update the `COMPARE_ROWS` constant so Free matches Pro 1 for the newly included features:
- "CV Analyses per month": Free `"1"` → `"3"`
- "Strength & Weakness Analysis": Free `false` → `true`
- "Missing Keyword Recommendations": Free `false` → `true`
- "Optimized Resume Generation": Free `false` → `"3 / mo"`
- "Cover Letter Generation": Free `false` → `"3 / mo"`

Leave "Priority Processing" as Pro 2 only.

## Not changing
- Pricing, Pro tiers, DB schema, entitlement checks (limit enforcement already keys off `getMonthlyLimit`).
- Any admin/analytics surfaces.

## Verification
- Load `/pricing` — Free card shows 3 analyses + full feature list, no strike-throughs; comparison table reflects updates.
- Load `/dashboard` as a free user — monthly cap displays as 3.
