Replace WhatsApp chat buttons on the landing page and support page with triggers that open the existing AI customer support chat widget.

## Changes

1. **Make AiChatWidget openable from external buttons**
   - Add a custom DOM event listener (`careerboost:open-chat`) inside `AiChatWidget` so buttons elsewhere on the page can programmatically open the chat.
   - On mount, listen for the event and call `setOpen(true)`.

2. **Landing page (`src/routes/index.tsx`)**
   - In the Contact section (`#contact`), replace the "Chat on WhatsApp" button with a "Chat with our AI Assistant" button.
   - The new button dispatches `careerboost:open-chat` to open the floating widget.
   - Update the surrounding copy from "Drop us a message on WhatsApp" to something AI-focused (e.g., "Get instant help from our AI Assistant — or escalate to a human if needed.").

3. **Support page (`src/routes/support.tsx`)**
   - Swap the primary "Talk to a human on WhatsApp" card with an AI Assistant card that opens the chat widget.
   - Keep one lower-priority human escalation path (e.g., reword the footer "Still need help?" card to mention WhatsApp as a backup).
   - Remove or repurpose inline `WhatsAppButton` instances so the AI chat is the first call-to-action.

4. **No backend changes**
   - Reuse the existing `/api/chat` route and `AiChatWidget` component. No new AI routes or models needed.

## Out of scope
- No changes to the WhatsApp escalation link *inside* the chat widget footer.
- No changes to the global FAB behavior or styling.
- No new database tables or server functions.
