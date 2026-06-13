## Motion Graphic Video — Career Boost Features

A ~28-second luxury-editorial motion piece showcasing the product, rendered to MP4 with a modern electronic soundtrack. Output saved to `/mnt/documents/career-boost-features.mp4` for download.

### Visual direction
- **Palette**: Deep green `#0b1612` / `#11201b`, gold `#c9a84c` / `#e6c98a`, cream text `#f5f2e8` (matches thecareerboost.com)
- **Type**: Fraunces (display, italic accents) + Inter (body) via `@remotion/google-fonts`
- **Motion system**: Smooth spring entrances (damping 18), staggered children, subtle parallax. Scene transitions via `TransitionSeries` — gold wipe + soft fade. Persistent gold-grain texture and slow-drifting orbs across all scenes for continuity.
- **Resolution**: 1920×1080, 30fps, ~840 frames total

### Scene breakdown (~28s)
1. **Hook (0–4s)** — Brand kicker "CAREER BOOST", animated gold underline, headline *"Your resume, tailored to win."* with italic gold accent. Subtitle fades in.
2. **Upload & AI parsing (4–9s)** — Animated dashed dropzone, PDF card drops in from above with spring, progress bar fills `Analyzing… → Resume parsed ✓`. Step label "01 — UPLOAD".
3. **ATS match score (9–15s)** — Big SVG progress ring animating 42% → 94%, percentage counter ticks up, keyword chips ("TypeScript", "Leadership", "Stakeholder Mgmt"…) stagger in with gold ✓ marks. Step "02 — ATS MATCH".
4. **AI rewrite before/after (15–21s)** — Split card: left "BEFORE" with struck-through generic bullets, gold arrow, right "AFTER" card with recruiter-ready bullets sliding in. Step "03 — AI REWRITE".
5. **Pricing + AI chat (21–25s)** — Three pricing tier cards stagger in (Free / Pro / Premium) with gold-bordered "Most popular" tier scaling slightly larger. AI chat bubble pops in lower-right with typing dots → reply ("Hi! Ask me anything about Career Boost"). Step "04 — ALWAYS-ON SUPPORT".
6. **CTA close (25–28s)** — Five gold stars, headline *"Land your next role."*, pulsing pill "Upload your resume →", URL `thecareerboost.com`.

### Audio
- Generate a 28-second **modern electronic** track via ElevenLabs Music API (sleek beats, refined synth pads, gentle build to CTA). Bundled into final MP4 via Remotion `<Audio>` + non-muted render.
- ElevenLabs is a standard connector — I'll check `list_connections` first and link it via `standard_connectors--connect` if not already linked.

### Technical approach
- New Remotion composition `features` in the existing `remotion/` project (reuses fonts, theme, render script).
- Five new scene files under `remotion/src/features/scenes/` + a `FeaturesVideo.tsx` orchestrator using `TransitionSeries`.
- Reuse existing `remotion/scripts/render-remotion.mjs` pattern; add a `render-features.mjs` that emits to `/mnt/documents/career-boost-features.mp4` **un-muted** with the ElevenLabs audio mixed in.
- Music file written to `remotion/public/audio/features-track.mp3` (kept local — not uploaded as a Lovable asset since it's only used at render time).
- Render in chunks if needed; expected total render time ~3-6 min, well within the 10-min sandbox limit.

### Deliverable
- One MP4 at `/mnt/documents/career-boost-features.mp4` (1920×1080, ~28s, with audio) the user can download and post anywhere.
- No changes to the live website — this is a one-off marketing artifact, not a feature added to the app.
