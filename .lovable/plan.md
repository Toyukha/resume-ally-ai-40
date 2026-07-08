## Plan: Verify PWA install flow (iOS + Android) and generate public preview link

### 1. Reproduce and verify current install flow
- Drive the preview with Playwright (Chromium) at `https://id-preview--0513bd07-9c48-4e1c-b5d9-4a9541a469a3.lovable.app` using two viewports:
  - Android emulation: Pixel 7 UA + viewport, verify `beforeinstallprompt` fires and the "Install app" button appears in the navbar.
  - iOS Safari emulation: iPhone UA + viewport, verify the iOS bottom-sheet hint appears with "Share → Add to Home Screen" instructions.
- Check manifest is served correctly (`/manifest.webmanifest`), icons resolve (192, 512, maskable, apple-touch-icon), and required meta tags are present in `<head>`.
- Capture screenshots at each step and inspect console for manifest/icon errors.

### 2. Fix issues found (expected likely problems)
Based on the current `install-app-button.tsx` implementation, likely fixes:
- **iOS detection**: ensure detection excludes already-installed standalone mode (`navigator.standalone`) and non-Safari iOS browsers (Chrome/Firefox on iOS can't install).
- **Android button visibility**: only render after `beforeinstallprompt` fires; hide if `display-mode: standalone` matches (already installed).
- **Dismiss behavior**: respect the `DISMISS_KEY` but add a re-show window (e.g., 7 days) so users who dismiss aren't permanently blocked.
- **Placement**: confirm the button is reachable on mobile viewports and not hidden behind other UI.
- **Manifest validation**: confirm `start_url`, `scope`, and icon `purpose` fields pass Chrome's installability criteria (Lighthouse PWA check via Playwright).

### 3. Re-verify after fixes
Re-run the Playwright flow on both emulated devices. Confirm:
- Android: install button appears, click triggers the native prompt (mocked via event dispatch), `appinstalled` hides the button.
- iOS: hint sheet appears once, dismiss persists, doesn't re-appear on reload within the cooldown window.

### 4. Generate public preview link
- Use Lovable's **Share → Share preview** feature to generate a 7-day public link (no login required). This is a UI action the user takes; I'll surface the exact steps and the fact that the current `id-preview--...lovable.app` URL requires login.
- Alternative: the app is already published at `https://resume-ally-ai-40.lovable.app` — publicly accessible now. I'll confirm this URL works for install testing on real devices.

### Technical details
- Files likely touched: `src/components/install-app-button.tsx` (detection + dismiss logic), possibly `public/manifest.webmanifest` (icon `purpose` fields if Lighthouse flags them).
- No backend changes.
- Testing tool: Playwright via shell, headless Chromium with device emulation.

### Deliverable to user
- Summary of what was broken and what was fixed.
- Two links: the already-live published URL (public, use this to test on your phone) and instructions to generate a 7-day share-preview link from the Lovable UI if you want to share the pre-publish preview.
