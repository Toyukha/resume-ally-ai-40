## Problem

WhatsApp group invite links (`chat.whatsapp.com/...`) cannot carry a prefilled message — WhatsApp intentionally does not support text prefill for group invites. That's why the current button opens the group but the details don't appear in the compose box. Only `wa.me/?text=...` (1:1 chats) and the native OS share sheet can prefill text.

## Fix

Change the share handler in `src/components/jobs/job-card.tsx` to use a tiered approach that actually gets the text in front of WhatsApp:

1. **Mobile / supported browsers → Web Share API** (`navigator.share`)
   - Opens the OS share sheet; user picks WhatsApp → picks the group → the title + company + link are prefilled in the compose box. This is the real "share to a WhatsApp group with details" flow.
   - Payload: `{ title, text: "<title> at <company>", url: detailUrl }`.
   - Silently ignore `AbortError` (user cancelled).

2. **Desktop fallback (no `navigator.share`) → WhatsApp Web with prefilled text**
   - Open `https://web.whatsapp.com/send?text=<encoded title + company + detail link>` in a new tab. WhatsApp Web opens with the message prefilled; the user picks the group from their chat list and hits send. Also copy the same text to the clipboard as a safety net so they can paste if needed.
   - Show toast: "Opening WhatsApp — pick the Career Boost group to share." Include a secondary toast action "Open group invite" that points at `WHATSAPP_GROUP_URL` for users not yet in the group.

3. **Final fallback (clipboard blocked too)** → open the group invite link and toast "Couldn't prefill — paste the job details in the group."

Analytics: keep the existing `trackJobWhatsAppShare("job_card")` call; add a `method` label (`"web_share" | "whatsapp_web" | "group_invite"`) so we can see which path users take.

## Verify

- Desktop preview: click Share → new tab opens `web.whatsapp.com/send?text=...` with the job title, company, and detail link prefilled; clipboard also contains the same text; toast appears.
- Mobile viewport (Playwright with a mobile UA that exposes `navigator.share`): click Share → native share sheet is invoked with the correct payload (verified by stubbing `navigator.share` and asserting the args).
- No changes to any other file; behaviour on the job detail page and saved-jobs page is unchanged because they render the same `JobCard`.

No new dependencies. Only `src/components/jobs/job-card.tsx` (and a small `method` param addition in `src/lib/whatsapp.ts`) change.