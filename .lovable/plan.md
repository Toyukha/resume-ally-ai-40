## 1. Remove "(TEST)" tag from auth email header

Our auth email templates and webhook do not contain any "(TEST)" or "[TEST]" text — I grepped `src/lib/email-templates/` and `src/routes/lovable/email/`. The tag is being injected outside our template code, most likely by the Lovable Cloud email layer (e.g. a "test mode" flag on the project's email config or a non-production From address). Action:

- Re-scaffold the auth email templates with overwrite, which re-generates the auth webhook + templates against the verified `notify.thecareerboost.com` sender and current FROM domain (`thecareerboost.com`). This typically clears any "TEST" prefix the dispatcher adds when it sees an unverified/sandbox configuration.
- Re-apply the existing Career Boost brand styling (emerald gradient header, gold accent, current copy) so nothing visual changes.
- After deploy, send a real signup to confirm the "(TEST)" is gone. If it still appears, the next step is to toggle the project's email config off "test" in Cloud → Emails (user-facing) — I'll surface clear instructions if that ends up being the source.

No copy or brand changes to the signup, magic-link, recovery, invite, email-change, or reauthentication templates beyond removing any incidental "Test" wording.

## 2. Country at signup (required, editable later)

### Database
Migration on `public.profiles`:
- Add `country_code TEXT` (ISO‑3166‑1 alpha‑2, e.g. `NG`, `US`) — nullable in DB so existing rows aren't broken, but enforced as required at the application layer for new signups.
- Add `CHECK (country_code ~ '^[A-Z]{2}$')` (deferred to a validation trigger rather than a CHECK so we can backfill later without restore issues).
- Index on `country_code` for admin filtering/aggregates.

### Signup form (`src/routes/auth.tsx`)
- Add a `Country` field to the Sign-up tab using `shadcn/ui` `Select` + a `Command`/`Popover` search (so the user can type "Nig…" and pick Nigeria). Required.
- Country list: built-in static list of ~250 ISO countries (`src/lib/countries.ts`) with name + alpha‑2 + flag emoji. Default selection: detect from `Intl.DateTimeFormat().resolvedOptions().timeZone` → country guess, but never auto-submit.
- On submit, pass `country_code` in `supabase.auth.signUp({ options: { data: { country_code } } })` so it lands on `auth.users.raw_user_meta_data`.
- Update `handle_new_user()` trigger to copy `NEW.raw_user_meta_data->>'country_code'` into `public.profiles.country_code` on insert.

### Editable later (profile)
- Add a Country field to the existing user profile/settings area (dropdown, same component) so existing users can fill it in. Users update their own profile via the existing RLS-permitted UPDATE policy on `profiles`.

## 3. Country column in Admin → Users dashboard

- Extend `listAllUsers` server fn (`src/lib/admin.functions.ts`) to select `country_code` from `profiles` and include it in the returned row shape.
- `src/routes/admin/users.tsx`: add a `Country` column between `Email` and `Plan`, rendering flag emoji + alpha‑2 (with full name on hover), or `—` if null.
- Extend the search box so a 2‑letter query (e.g. `NG`) or country name substring matches `country_code`.

## Technical details

```text
profiles
  + country_code  text   (nullable; validated `^[A-Z]{2}$`)
  + idx_profiles_country_code

auth.users.raw_user_meta_data.country_code  ──► handle_new_user() ──► profiles.country_code

src/lib/countries.ts            (ISO list)
src/components/country-select.tsx (searchable dropdown, reused on signup + profile)
src/routes/auth.tsx             (required Country field on Sign up)
src/lib/admin.functions.ts      (listAllUsers + getPlatformStats include country)
src/routes/admin/users.tsx      (new Country column, search by country)
```

Out of scope: country-based pricing/tax logic, geo-IP detection, and a per-country analytics chart (can add later if you want a breakdown).
