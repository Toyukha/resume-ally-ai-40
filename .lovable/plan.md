
## Goal

Produce a single, comprehensive **Business Knowledge Base (.docx)** that can be fed into an AI receptionist for the Career Boost website chat widget. It will consolidate everything the AI needs: brand, product, pricing, payments, support playbook, sales & objection handling, and safety rules.

## Deliverable

- File: `/mnt/documents/careerboost-ai-receptionist-kb.docx`
- Delivered inline via `<presentation-artifact>` so you can download it directly.
- Written in clean, section-based Markdown-style structure inside Word (H1 title, H2 sections, H3 sub-sections, bullet lists, and Q&A tables where useful).
- Voice-neutral phrasing so the same doc can also be pasted into any future channel (WhatsApp, voice) — but tone guidance is tuned for the on-site chat widget.

## Structure of the document

1. **About this document** — purpose, audience (the AI receptionist), how to use it.
2. **Company snapshot** — name, tagline, URL, founder/team, WhatsApp, support hours, region focus (Nigeria + international).
3. **Brand voice & tone rules** — warm, concise, professional; markdown allowed; no headings above H3; emoji sparingly; never invent facts.
4. **Product overview** — what Career Boost does, the full user flow (sign up → upload CV → paste JD → results in <1 min), outputs (ATS score, strengths/weaknesses, missing keywords, optimized resume, cover letter), Jobs marketplace, PWA install.
5. **Plans & pricing** (current, canonical values)
   - Free — ₦0 · 3 analyses/month · all Pro Plan 1 features.
   - Pro Plan 1 — ₦5,000/mo · 10 analyses.
   - Pro Plan 2 — ₦10,000/mo · 20 analyses · priority processing.
   - Renewal, upgrade/downgrade rules.
6. **Payments**
   - Flutterwave; Visa/Mastercard/Verve/Discover/Diners.
   - International cards work; charged in Naira equivalent (≈ $3.67 / $7.35).
   - Instant Pro activation.
7. **Refunds** — 7-day case-by-case; no refunds for unused analyses if plan worked; how to request via WhatsApp.
8. **Privacy & security** — CV use, no data sale, deletion process; never ask for passwords/OTP/full card numbers.
9. **Jobs marketplace** — supported countries, providers (Adzuna, Arbeitnow, Himalayas, RemoteJobs.org, Remotive, RemoteOK, Jobicy, WWR, Greenhouse/Lever/Ashby company boards), refresh cadence, coverage caveats (Nigeria/Ghana/Kenya limited).
10. **PWA / mobile install** — how iOS and Android users install.
11. **Account & auth** — sign-up flow, email verification, resend CTA, common errors (`otp_expired`, `access_denied`) and self-serve remedies.
12. **Support playbook / FAQs** — a Q&A table of the top ~30 real user questions with the canonical answer and when to escalate. Categories:
    - Pricing & plans
    - Payments & billing
    - Refunds
    - Account & login
    - Email verification issues
    - CV upload / analysis problems
    - Cover letter / optimized CV
    - Jobs marketplace
    - PWA install
    - Privacy & data deletion
    - General “how does this work”
13. **Sales & objection handling**
    - “Is it worth it?”
    - “I’m outside Nigeria, can I pay?”
    - “Why not just use ChatGPT?”
    - “Do you guarantee I’ll get a job?”
    - “Can I try Pro before paying?”
    - Upgrade nudges (free → Pro, Pro 1 → Pro 2).
14. **Escalation rules** — when to hand off to WhatsApp (+234 813 890 8924 / https://wa.me/2348138908924); exact wording template.
15. **Safety & compliance guardrails**
    - Never invent prices, dates, refund terms, features.
    - Never request passwords, OTPs, full card numbers.
    - Never make legal/medical/financial guarantees.
    - Always cite WhatsApp for account-specific issues.
16. **Key links reference** — /pricing, /refund, /privacy, /terms, /support, /auth, WhatsApp, WhatsApp group.
17. **Change log & ownership** — who updates this, cadence, version.

## How I’ll build it

- Use the `docx` skill to generate the .docx (Arial, US Letter, proper heading styles, bullet lists via `LevelFormat.BULLET`, tables with dual widths and `ShadingType.CLEAR` for the FAQ Q&A grid).
- Pull all canonical facts from the codebase so numbers match reality:
  - `src/lib/chat-system-prompt.ts` (existing assistant knowledge)
  - `src/lib/plans.ts` (plan limits)
  - `src/lib/whatsapp.ts` (WhatsApp number + group link)
  - `src/lib/job-countries.ts`, `src/lib/job-company-boards.ts`, `src/lib/jobs.functions.ts` (jobs coverage)
  - `src/routes/pricing.tsx`, `src/routes/refund.tsx`, `src/routes/privacy.tsx` (policy wording)
- Validate the generated .docx (`validate_document.py`) and render each page to an image to visually QA layout before delivery.
- No code or app behavior changes — this is a documentation deliverable only.

## Out of scope (for this task)

- Wiring the KB into the live chat widget or replacing `CHAT_SYSTEM_PROMPT`. (Happy to do that as a follow-up: either embed a condensed version into the system prompt, or add a retrieval step.)
- Multi-language versions.
- Voice/WhatsApp channel variants.
