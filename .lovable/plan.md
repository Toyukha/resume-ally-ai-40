Add a reusable WhatsApp group announcement card to the landing page and sign-up page. The card uses the WhatsApp brand green, links directly to the provided group invite, opens in a new tab, and tracks clicks with the existing analytics helper.

### User choices gathered
- **Placement**: After the hero on the landing page; at the top of the auth card on the sign-up page.
- **Dismissal**: Always visible (no dismiss control).
- **Design style**: WhatsApp green brand (#25D366).
- **Icon**: WhatsApp logo SVG (reuse the existing logo from the codebase).
- **Link type**: Direct link to the user-provided WhatsApp group invite URL.
- **Open target**: New tab.
- **Analytics**: Track clicks.
- **Card size**: Compact card (not full-width banner).
- **Heading text**: "Join our WhatsApp group to stay updated on jobs and announcements." (plural form).
- **Subtext**: Add a one-line subtext — "Get instant alerts for new opportunities and platform updates."
- **Button label**: "Join on WhatsApp".
- **Animation**: Fade in and slide up on page load, using the existing `animate-fade-in` utility.

### Implementation plan

1. **Create a reusable component** at `src/components/whatsapp-group-banner.tsx`.
   - Wrap the WhatsApp logo SVG in a small circle icon on the left.
   - Use WhatsApp green (#25D366) as the card background with white text/button.
   - Apply the existing `Card` component and `Button` component (with custom override for the green-on-white button).
   - Add a CTA linking to `https://chat.whatsapp.com/IgutFNzG4xXAMSCoo6bpcf` with `target="_blank"` and `rel="noopener noreferrer"`.
   - On click, call the existing analytics helper to record a `whatsapp_group_join` event with a `location` property (e.g. `landing` or `auth`).
   - Apply `animate-fade-in` to the card root.
   - Keep it compact, centered, and responsive.

2. **Add the card to the landing page** (`src/routes/index.tsx`).
   - Insert the component right after the hero section and before the walkthrough section.
   - Pass `location="landing"` to the analytics prop.

3. **Add the card to the auth page** (`src/routes/auth.tsx`).
   - Insert the component at the top of the auth card, above the welcome header and sign-in/sign-up tabs.
   - Pass `location="auth"` to the analytics prop.

4. **Verify** by checking the landing page and auth page in the preview.
   - Confirm the card renders, opens the correct WhatsApp link in a new tab, and animates in on load.
   - Confirm no TypeScript or build errors.

### Technical notes
- No new dependencies are required.
- The component will use the existing `Card` and `Button` primitives plus the existing `animate-fade-in` animation class.
- Analytics will reuse the existing `trackWhatsAppClick` or `trackEvent` helper (or the closest equivalent if the helper name differs in the codebase).