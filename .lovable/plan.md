## Goal

Replace the WhatsApp floating button as the primary customer-service channel with an AI chatbot trained on Career Boost's site knowledge (plans, pricing, refund policy, payments, features, support). WhatsApp remains available as a human-escalation fallback inside the chatbot and on the Support page.

## UX

- Floating circular button (bottom-right, replaces the green WhatsApp FAB) opens a chat panel.
- Chat panel:
  - Header: "Career Boost Assistant" + close button + small "Chat on WhatsApp" escalation link.
  - Greeting message + 3 suggested questions ("How much is Pro?", "How do I pay from outside Nigeria?", "How do refunds work?").
  - Streaming assistant replies rendered as markdown.
  - Composer with Send button; disabled while streaming.
  - Footer micro-link: "Still need a human? Message us on WhatsApp."
- No conversation history — chat resets on reload (per user choice).
- Support page: keep WhatsApp CTA (it's the explicit human escalation), but add a prominent "Ask the AI Assistant" card above it that opens the same chat widget.

## Architecture

Stack: TanStack Start + AI SDK + Lovable AI Gateway (no user-provided keys).

### Backend
- New server route `src/routes/api/chat.ts` using `createFileRoute("/api/chat")` with a POST handler.
- Uses `createLovableAiGatewayProvider` from existing `src/lib/ai-gateway.server.ts`.
- Model: `google/gemini-3-flash-preview` (fast, cheap, supports streaming).
- `streamText` with `convertToModelMessages` and `toUIMessageStreamResponse`.
- System prompt baked with Career Boost knowledge:
  - Product: AI resume optimizer (ATS scoring, tailored cover letters, keyword matching).
  - Plans (from `src/lib/plans.ts`): Free, Pro Plan 1 (₦5,000/mo), Pro Plan 2 (₦10,000/mo) — list features/limits.
  - International payment note: Naira equivalent is what's charged (₦5,000 ≈ $3.67, ₦10,000 ≈ $7.35); cards accepted (Visa, Mastercard, Discover, Diners, Verve).
  - Refund policy summary (pulled from `/refund`).
  - Privacy summary (pulled from `/privacy`).
  - Support hours: Mon–Sat, 9am–6pm WAT.
  - Escalation rule: if user asks something the bot can't confidently answer (account-specific issues, billing disputes, bugs), recommend WhatsApp at +234 813 890 8924.
  - Tone: warm, concise, professional. Markdown formatting allowed.
  - Never invents prices, dates, or policies not in the prompt.

### Frontend
- Install AI Elements components: `conversation`, `message`, `prompt-input`, `shimmer`.
- New component `src/components/ai-chat-widget.tsx`:
  - FAB + dialog panel (Sheet or custom popover anchored bottom-right).
  - Uses `useChat` from `@ai-sdk/react` with `DefaultChatTransport({ api: "/api/chat" })`.
  - Renders `message.parts` via `MessageResponse` (markdown).
  - Shimmer "Thinking..." on `submitted` status.
  - Suggested-question chips that call `sendMessage`.
  - WhatsApp escalation link in header + footer using existing `getWhatsAppUrl()`.
- Update `src/routes/__root.tsx`: replace `<WhatsAppButton variant="fab" />` with `<AiChatWidget />`.
- Update `src/routes/support.tsx`: add an "Ask the AI Assistant" card at the top of the support topics area; keep the WhatsApp CTA card and footer (now framed as "Talk to a human").

## Files

New:
- `src/routes/api/chat.ts` — streaming chat endpoint.
- `src/lib/chat-system-prompt.ts` — exported system prompt string built from site knowledge.
- `src/components/ai-chat-widget.tsx` — FAB + chat panel.
- `src/components/ai-elements/*` — installed via `bun x ai-elements@latest add conversation message prompt-input shimmer`.

Edited:
- `src/routes/__root.tsx` — swap FAB.
- `src/routes/support.tsx` — add AI assistant entry point above WhatsApp escalation.

Unchanged:
- `src/components/whatsapp-button.tsx` (still used inline on Support page and inside the chat widget).
- `src/lib/whatsapp.ts`.

## Out of scope (for this turn)

- Account-aware answers (subscription status, recent analyses) — would require auth + tools; user picked static knowledge only.
- Persisting chat history — user picked "No history".
- Admin moderation dashboard for chats.

## Validation

- Typecheck passes.
- Manually verify: FAB opens panel, sends a message, streams an answer, suggested chips work, WhatsApp escalation links open WhatsApp, reload clears the chat.
