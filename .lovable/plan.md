## Mobile UX fixes

### 1. Fix `/jobs` horizontal overflow (the real bug)
In `src/routes/_authenticated/jobs.index.tsx`, add `min-w-0` to the results column so its grid cell can shrink and the existing `overflow-x-auto` strips actually scroll instead of stretching the page to 1274px on mobile.

```diff
- <div className="space-y-4">
+ <div className="min-w-0 space-y-4">
```

### 2. Enlarge sub-36px tap targets
Audit flagged ~8 icon buttons per page (navbar, job card actions, dialog/close, dismiss chips) measuring under 36×36 — below the WCAG 2.5.5 / Apple HIG comfort target.

- Navbar icon buttons (mobile menu, theme toggle, profile) → bump from `h-8 w-8` / `size="sm"` to `h-10 w-10`.
- Job card action icons (save, share, dismiss) → ensure min `h-10 w-10` hit area, keeping the icon glyph the same visual size.
- `ActiveFilterChips` close (×) buttons → wrap in `h-9 w-9` tap area on mobile while keeping the visual chip compact.
- Dialog/Sheet close buttons → bump from `h-6 w-6` to `h-9 w-9`.

Scope: only the components flagged on /, /auth, /dashboard, /jobs, /support. No visual redesign — just bigger invisible hit areas.

### 3. Suppress NotFoundComponent SSR hydration mismatch
The root not-found shell wraps its body in `<Suspense>` which mismatches between server and client render. Remove the unused Suspense wrapper (or gate it `<ClientOnly>`) so React stops logging the hydration warning. Cosmetic only.

### Verification
Re-run the mobile Playwright audit (390×844, iPhone UA) and confirm:
- `/jobs` scrollWidth === clientWidth (no horizontal scroll)
- tap-target counts drop to ~0 small targets on audited pages
- no pageerror entries for hydration mismatch

### Out of scope
No design system changes, no copy edits, no new components. Filter/sort logic and server functions untouched.
