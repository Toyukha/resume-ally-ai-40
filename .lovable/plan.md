## Objective

Make the "Paying from outside Nigeria?" badge on the Pricing page even bolder and more visible, and add a currency equivalence note so international subscribers understand they'll be charged in Naira equivalent.

## Changes

### 1. Pay from outside Nigeria? text — make it bolder and more visible

File: `src/routes/pricing.tsx` (lines 119-121)

- Increase border opacity: `border-gold/40` → `border-gold/60`
- Add a soft gold glow shadow to the outer card: `shadow-elegant` → `shadow-gold-glow`
- Badge padding: `px-4 py-1.5` → `px-5 py-2`
- Badge font weight: `font-bold` → `font-black`
- Badge shadow: `shadow-md` → `shadow-lg`
- Add a subtle ring: `ring-2 ring-gold-foreground/20`
- Globe icon size: `h-4 w-4` → `h-5 w-5`

### 2. Add currency equivalence note

File: `src/routes/pricing.tsx` (insert after the existing paragraph in the callout)

- Add a small highlighted box with:
  - A bordered, gold-tinted background (`bg-gold/10`, `border-gold/30`)
  - Text: "Note: the Naira equivalent of your currency will be deducted — not your local currency."
  - Inline bold amounts: ₦5,000 ≈ $3.67 | ₦10,000 ≈ $7.35
  - Styled as `text-xs font-semibold text-gold-foreground`

## Scope

Only `src/routes/pricing.tsx` is touched. No backend, no other routes, no dependencies needed.