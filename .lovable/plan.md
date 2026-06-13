# Remove Paddle, route everyone through Flutterwave

Goal: Strip Paddle from the user-facing site entirely. Replace the "USD checkout coming soon" pill with an eye-catching banner telling international users to pick **Card** in the Flutterwave checkout to subscribe. NGN remains the only displayed currency; Flutterwave already accepts international Visa/Mastercard via its Card option.

## Pricing page (`src/routes/pricing.tsx`)

- Remove imports/usage of `usePaddleCheckout`, `getPaddleEnvironment`, and the Paddle branch in `startCheckout` — every Pro purchase calls `initFlutterwavePayment`.
- Delete the currency toggle and the "USD checkout coming soon" pill. Always show NGN prices (`priceLabel`), no currency state.
- Replace the toggle area with a **bold, stylish callout** aimed at international users:

  > 🌍 **Outside Nigeria?** Choose **"Card"** at checkout to pay with any international Visa, Mastercard, or Verve — instant access in seconds.

  Styling: full-width rounded gradient card (uses `--gradient-primary` token), gold accent border, globe icon, large display font for "Outside Nigeria?", supporting line beneath. Sits where the toggle used to.
- Update trust badge line + per-card subtext to drop "Paddle" — keep "Secured by Flutterwave · 30 days access".
- Update FAQ entries: remove Paddle/USD/auto-renew wording. Billing answer becomes "Pro Plan 1 (₦5,000) and Pro Plan 2 (₦10,000) are one-time 30-day passes via Flutterwave. International cards are accepted — choose the Card option at checkout." Adjust the auto-renew, cancel, methods, and upgrade Q&As accordingly. Refund answer: single 7-day window if unused.

## Dashboard (`src/routes/_authenticated/dashboard.tsx`)

- Remove the `createPaddlePortalSession` import, `portalFn`, `portalMutation`, and the **Manage** button (Paddle-only). Flutterwave plans simply expire — no portal needed.
- Keep the existing **Refresh status** button and Upgrade button.
- Keep the `?checkout=success` / `?upgraded=1` polling — Flutterwave callback also benefits from it.

## Refund policy (`src/routes/refund.tsx`)

- Collapse the split policy to a single 7-day refund window (Flutterwave only), and drop Paddle references.

## Files deleted

- `src/hooks/usePaddleCheckout.ts`
- `src/lib/paddle.ts`
- `src/lib/paddle.server.ts`
- `src/lib/paddle-portal.functions.ts`
- `src/components/PaymentTestModeBanner.tsx` (Paddle-only banner; not referenced elsewhere after pricing cleanup — will verify before deleting)
- `src/routes/api/public/payments/webhook.ts` (Paddle webhook route)

If `PaymentTestModeBanner` is still mounted from `__root.tsx`, remove that import/usage too.

## Files kept (intentionally)

- `src/lib/payments.functions.ts` — only used by Paddle currently; will be deleted if no other consumer remains after the pricing edit.
- Flutterwave files untouched.
- Legal pages (terms, privacy) keep the generic "third-party payment processor" wording; only Paddle-specific lines are removed.

## DB / migrations

No schema changes. The `subscriptions` table's `paddle_*` columns stay (historical data); they're simply unused going forward. No new migrations.

## Verification

After edits, the type-check must pass with zero references to `paddle` outside the auto-generated `routeTree.gen.ts` (which regenerates) and the `subscriptions` table columns. I'll grep `paddle` / `Paddle` and confirm only DB column names remain.

## Out of scope

- Secrets cleanup (Paddle env vars) — these can stay set; no code reads them anymore.
- Removing `paddle_*` columns from the DB.
