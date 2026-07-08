# Turn Career Boost into a Mobile App

Two-phase plan: ship an installable **PWA** now so users can add Career Boost to their home screen on Android and iOS today, then wrap it with **Capacitor** later to publish to Google Play and the App Store.

---

## Phase 1 — Installable PWA (ship now)

Goal: user visits the site on their phone → gets an "Install app" prompt (Android) or uses "Add to Home Screen" (iOS) → launches Career Boost with an app icon, splash screen, and no browser chrome.

### 1. Web App Manifest
Create `public/manifest.webmanifest` with:
- name: "Career Boost", short_name: "Career Boost"
- theme_color + background_color from the site's brand tokens
- `display: "standalone"`, `start_url: "/dashboard"`, `scope: "/"`
- icon set: 192, 512, and 512 maskable (generated from the existing brand asset)
- `apple-touch-icon` for iOS home screen

### 2. Head tags (in `src/routes/__root.tsx`)
- `<link rel="manifest" href="/manifest.webmanifest">`
- `<meta name="theme-color">`
- `<link rel="apple-touch-icon">` + `apple-mobile-web-app-capable`, `apple-mobile-web-app-title`

### 3. Install prompt UX
- Small "Install app" button in the navbar (mobile only) that fires the captured `beforeinstallprompt` event on Android/Chrome.
- iOS Safari doesn't support the prompt API — show a one-time bottom sheet with the "Share → Add to Home Screen" instructions when a user visits on iOS Safari.

### 4. Native-like features that work in a PWA (no store needed)

| Feature | How |
|---|---|
| **Push notifications** | Web Push via a dedicated `firebase-messaging-sw.js` service worker + FCM. Works on Android + desktop today; works on iOS 16.4+ **only after** the user installs the PWA to home screen. Store the FCM token per user, send from our existing server functions. |
| **Camera / photo upload for CV** | `<input type="file" accept="image/*,application/pdf" capture="environment">` on the resume upload screen — opens the native camera picker. Zero native code. |
| **Biometric login (Face ID / fingerprint)** | WebAuthn passkeys via `navigator.credentials.create/get`. Register a passkey after email+password login; subsequent logins use Face ID / Touch ID / Android biometrics. Requires adding a `webauthn_credentials` table + two server functions (register + verify) on Lovable Cloud. |

### 5. What we deliberately skip in Phase 1
- No app-shell service worker / offline caching (per Lovable PWA rules — users didn't ask for offline, and offline SWs cause preview breakage). Push worker only.
- No cache-busting hacks — Lovable hosting handles that.

---

## Phase 2 — Capacitor native wrapper (when Play + Apple accounts are ready)

Deferred until you have the developer accounts. When you say go, we'll:
1. Add Capacitor to the repo (`@capacitor/core`, `@capacitor/android`, `@capacitor/ios`) as a separate build target — the web app stays unchanged.
2. Point Capacitor at the deployed site URL (or bundle the built assets).
3. Swap the web push implementation for `@capacitor/push-notifications` (APNs on iOS, FCM on Android) — same server, different token type.
4. Swap WebAuthn for `capacitor-biometric-authentication` (uses native Keychain / Keystore).
5. Add app icons + splash screens, configure `capacitor.config.ts` (app id `com.thecareerboost.app`).
6. Build `.aab` for Play Store, `.ipa` for App Store, submit for review.

Store fees you'll need: Apple Developer $99/yr, Google Play $25 one-time.

---

## Technical notes

- **Push server**: we already have server functions on Lovable Cloud — add one that accepts an FCM token, stores it against `auth.uid()` in a new `push_tokens` table (RLS: user can only insert/delete their own), and another admin-invoked function that sends notifications via FCM HTTP v1 using a service account secret.
- **FCM setup requires**: a Firebase project (free), a service account JSON stored as a Lovable Cloud secret, and a VAPID public key exposed as `VITE_FIREBASE_VAPID_KEY`.
- **WebAuthn**: use `@simplewebauthn/browser` + `@simplewebauthn/server`. RP ID = `thecareerboost.com`. Credentials table stores `credential_id`, `public_key`, `counter`, `user_id`.
- **iOS PWA push caveat**: Safari only delivers push to *installed* PWAs on iOS 16.4+. First-run iOS users must install to home screen before we can even request notification permission — the install nudge above handles this.
- **Manifest icons**: generated from the existing Career Boost logo asset; no new design needed.

---

## What ships in Phase 1 (files changed)

- `public/manifest.webmanifest` (new)
- `public/icon-192.png`, `public/icon-512.png`, `public/icon-512-maskable.png`, `public/apple-touch-icon.png` (new)
- `public/firebase-messaging-sw.js` (new — push only, not an app-shell SW)
- `src/routes/__root.tsx` (manifest + apple meta tags)
- `src/components/install-app-button.tsx` (new)
- `src/components/ios-install-hint.tsx` (new)
- `src/components/biometric-setup.tsx` (new — passkey enrollment in account settings)
- `src/lib/push.functions.ts` (new — register FCM token server fn)
- `src/lib/webauthn.functions.ts` (new — passkey register + verify server fns)
- Migration: `push_tokens` table + `webauthn_credentials` table with RLS and GRANTs
- Secrets: `FIREBASE_SERVICE_ACCOUNT_JSON`, `VITE_FIREBASE_VAPID_KEY`, `FIREBASE_PROJECT_ID` (I'll request these when we implement)

Approve this and I'll build Phase 1.
