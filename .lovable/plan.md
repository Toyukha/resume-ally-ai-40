## Goal

Stop users landing in the "Email not verified" dead end after clicking the verification link. Make the confirmation callback robust and give stuck users a one-click way to resend the email.

## What's happening today

- Email delivery is healthy (all recent signup emails were delivered).
- 3 users in the last 30 days signed up and never got confirmed — they clicked the link but confirmation didn't complete, and there's no recovery path in the UI.
- `src/routes/auth.tsx` hardcodes `emailRedirectTo: "https://thecareerboost.com/auth"` and the `/auth` page only reads the session; it doesn't process a PKCE `?code=…` callback or surface Supabase error params like `otp_expired` / `access_denied`.
- The sign-in form shows the raw "Email not confirmed" toast with no action.

## Changes (frontend only, no schema/backend changes)

### 1. Make `emailRedirectTo` origin-aware

In `src/routes/auth.tsx` `signUp`:

- Use `${window.location.origin}/auth` instead of a hardcoded host, so users on `thecareerboost.com`, `www.thecareerboost.com`, or a preview URL are redirected back to the same origin they signed up from.
- Same treatment for the "Resend" call added below.

### 2. Handle the confirm-link callback on `/auth`

Add a `useEffect` on mount that:

- Reads `window.location.hash` and `window.location.search`.
- If `?code=…` is present, call `supabase.auth.exchangeCodeForSession(code)`; on success, clear the query and navigate to `/dashboard`; on failure show a friendly error.
- If the hash or query carries `error` / `error_code` / `error_description` (e.g. `otp_expired`, `access_denied`), render an inline alert on the sign-in card: "Your verification link expired or was already used. Enter your email and click Resend verification email."
- After handling, strip the sensitive params from the URL with `history.replaceState` so a reload doesn't retry the exchange.

### 3. Add "Resend verification email"

- New small handler that calls `supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: '${origin}/auth' } })`.
- Surface it in two places:
  - Inline in the "link expired" alert from step 2.
  - Under the sign-in form when the sign-in error message is "Email not confirmed" (detect on the message from `signInWithPassword`).
- Show a success toast when the resend succeeds.

### 4. Improve the sign-in error UX

Replace the generic `toast.error(error.message)` with a small branch:

- `Email not confirmed` → set local `needsConfirm=true`, show inline "We haven't verified this email yet — resend verification email?" with a button that calls the resend handler above.
- `Invalid login credentials` → keep the toast but use friendlier copy ("Wrong email or password").
- Anything else → existing toast.

### 5. Signup success copy

After a successful `signUp`, replace the current toast with an inline confirmation panel on the auth card: "Check bsh***@gmail.com for a link to confirm your account. Didn't get it? Resend." The Resend button calls the same handler from step 3.

## Files touched

- `src/routes/auth.tsx` — all UI/logic changes above.
- No new files, no server functions, no DB migrations, no email-template edits.

## Verification

- Drive `/auth` via Playwright: submit signup with a throwaway address, confirm the success panel + Resend button render and Resend triggers a new pending row in `email_send_log` for `signup`.
- Simulate the expired-link path by opening `/auth#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired` and confirm the inline alert + Resend button appear and the hash is cleared afterwards.
- Sign in with an unconfirmed account and confirm the inline "resend verification" CTA appears instead of a dead-end toast.
- Query `auth.users` after each attempt to confirm `email_confirmed_at` gets set on a fresh click of a valid new link.

## Out of scope

- No changes to the auth webhook, email templates, queue, or DB — those are already working.
- Supabase Site URL / Additional Redirect URLs allow-list: I'll note in the final message that `https://thecareerboost.com/auth`, `https://www.thecareerboost.com/auth`, and the preview host must all be listed in the Auth redirect allow-list; if any are missing, `/verify` will refuse to confirm regardless of our client fixes.
