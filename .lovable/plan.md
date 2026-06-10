## Add password reveal/hide toggle on Auth page

### What
Add an eye-icon toggle inside password inputs on the `/auth` page so users can show or hide their password while typing.

### How
1. **Import icons** — Add `Eye` and `EyeOff` from `lucide-react`.
2. **Add visibility state** — Add a `showPassword` boolean state to `AuthPage`.
3. **Extend the `Field` component** — Add an optional `isPassword` prop. When true:
   - Render a toggle button on the right side of the input (absolute positioned).
   - Clicking it flips `showPassword` state.
   - The input `type` becomes `"text"` when visible, `"password"` when hidden.
   - Add `pr-9` padding so the password text does not overlap the toggle.
4. **Wire both forms** — Apply `isPassword` to the password fields in the Sign in and Sign up tabs.

### Files changed
- `src/routes/auth.tsx`