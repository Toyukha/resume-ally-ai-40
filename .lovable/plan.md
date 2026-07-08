## Fix: iOS install card feels unresponsive

### Problem
On iOS, Safari does not expose a programmatic install API — apps can only be added to the Home Screen manually via Share → Add to Home Screen. Our current iOS hint is a passive info card: the only interactive element is the small `X` dismiss button. Tapping the card body does nothing, which reads as "broken" (exactly what you experienced on iOS 11).

Also worth noting: iOS 11 has very limited PWA support (proper support landed in 11.3, and modern manifest features assume iOS 16+). Install-to-Home-Screen itself does work on 11.3+, but the experience is bare-bones.

### Fix
Make the iOS card obviously actionable and self-explanatory:

1. **Tap-to-expand**: tapping the card opens a full instruction sheet (modal / bottom sheet) with a large, numbered visual walkthrough:
   - Step 1: Tap the Share icon (with screenshot-style illustration of Safari's bottom bar)
   - Step 2: Scroll and tap "Add to Home Screen"
   - Step 3: Tap "Add" in the top-right
2. **Clear affordance**: add a "Show me how" button inside the card so it visibly looks tappable, not just informational.
3. **Browser guard**: if the user is on iOS but NOT Safari (Chrome/Firefox/in-app browser), show a different message telling them to open the site in Safari — installing from other iOS browsers is impossible.
4. **iOS-version note**: if UA reports iOS < 11.3, show a short "update iOS to install" message instead of the walkthrough (prevents another dead-end tap).
5. **Analytics**: add `ios_hint_expanded` event so we can see how often people actually open the instructions.

### Files touched
- `src/components/install-app-button.tsx` — expand iOS branch into tap-to-open sheet with walkthrough, add Safari + iOS-version detection.
- `src/lib/pwa-analytics.ts` — add `ios_hint_expanded` to the event union.

### Verification
- Playwright with iPhone Safari UA: card visible, tapping card opens the walkthrough sheet, dismiss still works, `ios_hint_shown` + `ios_hint_expanded` events fire.
- Playwright with iPhone Chrome (CriOS) UA: shows the "open in Safari" variant.
- Real-device sanity check via the published URL `https://thecareerboost.com` on your iOS 11 device.

No backend or business-logic changes.