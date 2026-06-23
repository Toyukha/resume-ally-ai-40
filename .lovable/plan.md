Mirror the "Paying from outside Nigeria?" callout from `/pricing` onto the landing-page pricing section in `src/routes/index.tsx`, sitting between the section heading and the three-plan grid.

**Edits**
- `src/routes/index.tsx`
  - Add `Globe` and `CreditCard` to the existing `lucide-react` import.
  - Inject the callout markup right after the heading block (before the `md:grid-cols-3` grid at line 146), reusing the exact pattern from `src/routes/pricing.tsx:115-145`:
    - Gold-bordered, gradient-padded card (`max-w-3xl`, centered, `mt-12 mb-4`).
    - Floating gold pill with `Globe` icon and "Paying from outside Nigeria?" label.
    - Primary-gradient icon tile with `CreditCard`, headline using the existing `.text-gradient` accent on "Card", supporting copy listing Visa / Mastercard / Discover / Diners Club / Verve, and the gold note strip with the ₦5,000 ≈ $3.67 and ₦10,000 ≈ $7.35 line.
  - No copy or token changes — uses existing `bg-hero`, `border-gold/40`, `shadow-elegant`, `text-gradient` utilities so it matches the rest of the landing page.

No other files, no schema changes, no behavior changes.
