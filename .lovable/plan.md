## Goal

Build a punchy, scroll-stopping animated carousel video from the 6 supplied slides. Modern tech gradient aesthetic (electric blue → teal → violet), pulsing motion, music + SFX, ~30s total (~5s/slide). Export 9:16 (Reels/TikTok/Status) and 1:1 (Instagram/LinkedIn feed) MP4s.

## 1. Remotion composition

New folder `remotion/src/carousel/` with its own composition registered in `remotion/src/Root.tsx`:
- `carousel-9x16` — 1080×1920, 30 fps, 900 frames (30s)
- `carousel-1x1` — 1080×1080, 30 fps, 900 frames

Shared `CarouselVideo.tsx` reads `format` prop (`'9x16' | '1x1'`) to adjust type scale, line widths, and safe-area padding. Both compositions use the same scene components.

## 2. Visual direction — "Modern Tech Gradient"

- **Palette**: deep navy `#0A0F2C` base, electric blue `#3B82F6`, cyan `#22D3EE`, violet `#A78BFA`, soft white `#F5F8FF`.
- **Persistent layers (full duration)**:
  - Animated mesh-gradient background drifting via `interpolate(frame, [...], [...])` on background-position.
  - Floating blurred orbs (CSS `filter: blur()`, kept to 3 elements to stay performant in headless Chromium).
  - Subtle 1px grid overlay at 6% opacity for "tech" texture.
- **Typography**: Inter 800 (headlines), Inter 500 (body), JetBrains Mono 500 (slide counter `01 / 06`).
- **Motion system**:
  - Default entrance: blur-to-sharp + slide-up 40px, spring `{ damping: 18, stiffness: 140 }`.
  - Exit: opacity → 0 + slide-up 30px over 12 frames.
  - Words split into spans, staggered 3 frames each (kinetic typography).
  - Accent: pulsing dot/underline driven by `Math.sin(frame / 6)`.
- **Scene transitions**: `TransitionSeries` with `slide({ direction: 'from-bottom' })` between slides, `springTiming({ durationInFrames: 18 })` — fast, decisive cuts.

## 3. Scene-by-scene

Each scene ~150 frames (5s), built as `scenes/Slide{N}.tsx`:

1. **Slide 1 — Hook**: "You're qualified." appears first (large), beat, then "So why aren't you getting interviews?" slides in below with a pulsing question-mark accent. Slight zoom on full text near end.
2. **Slide 2 — ATS**: Animated "ATS" badge in a scanning frame. Resume card slides in, red ✕ stamps over it on word "reject". Subtitle types in below.
3. **Slide 3 — Keywords**: Floating keyword chips (`React`, `TypeScript`, `Leadership`, etc.) drift in; half fade to 20% opacity on the word "missing"; a falling visibility meter graph reinforces "hurt visibility".
4. **Slide 4 — Generic CVs**: Grid of 6 identical grey resume thumbnails; one in the center is highlighted but still grey — illustrating "rarely stand out". Headline kinetic-types in.
5. **Slide 5 — Solution**: Logo wordmark "The Career Boost" assembles letter-by-letter; checkmark + gradient sweep crosses the screen; "helps you fix this" reveals with confident spring.
6. **Slide 6 — CTA**: Big URL `www.thecareerboost.com` with cursor blink, pulsing gradient pill underneath, slide counter resolves to `06 / 06`.

Persistent chrome on every slide: top-left small wordmark, top-right slide counter `0N / 06`, bottom progress bar filling 0→100% over the full video.

## 4. Captions (burned-in)

Already-large headline text effectively serves as captions. Add a small bottom-aligned secondary caption strip only on slides 2-5 mirroring the supporting line, for sound-off viewers on busy feeds. Inter 600, white on `rgba(0,0,0,0.55)` rounded pill, 6-frame fade.

## 5. Audio

Verify ElevenLabs connector linked (`standard_connectors--list_connections`); link if missing.

- **Music** — one `/v1/music` track, ~30s, prompt: *"Modern tech SaaS pulse, driving synth arpeggio, sub bass, building tension into confident uplifting resolution at 25s, instrumental, no vocals, 30 seconds, 120 BPM"*. Saved to `remotion/public/audio/carousel-music.mp3`.
- **SFX** via `/v1/sound-generation` (saved next to music):
  - `swipe.mp3` (0.4s) — between every slide
  - `stamp.mp3` (0.5s) — Slide 2 reject stamp
  - `chip-pop.mp3` (0.3s) — Slide 3 keyword chips
  - `success-chime.mp3` (1.0s) — Slide 5 brand reveal
  - `cta-impact.mp3` (0.8s) — Slide 6 URL
- Generator script `remotion/scripts/generate-carousel-audio.mjs` (batched, idempotent — skips if file exists).
- Wired in `CarouselVideo.tsx` via top-level `<Audio>` for music (volume 0.6, ducks to 0.4 during Slide 5/6 via interpolated volume) and `<Sequence><Audio/></Sequence>` per SFX cue.

## 6. Rendering

New `remotion/scripts/render-carousel.mjs`:
- Bundles via `@remotion/bundler`.
- Renders `carousel-9x16` → `/mnt/documents/career-boost-carousel-9x16.mp4`.
- Renders `carousel-1x1` → `/mnt/documents/career-boost-carousel-1x1.mp4`.
- Uses the proven sandbox config: `chromeMode: 'chrome-for-testing'`, `--no-sandbox --disable-gpu --disable-dev-shm-usage`, `concurrency: 1`, audio enabled (`muted: false`).

## Deliverables

- `career-boost-carousel-9x16.mp4` (1080×1920) and `career-boost-carousel-1x1.mp4` (1080×1080) in `/mnt/documents/`, ~30s each, with music + SFX.
- Reusable Remotion source under `remotion/src/carousel/` + render and audio-gen scripts committed.

## Out of scope

- Voice-over narration.
- Homepage embed of this carousel (existing walkthrough already plays in hero).
- 16:9 or 4:5 exports (can be added later by registering more compositions).
