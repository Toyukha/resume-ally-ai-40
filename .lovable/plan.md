## Launch Demo Video — "The Career Boost"

A ~70-second motion-graphics demo in the style of Notion/Grammarly ads, built in Remotion (1920×1080, 30 fps). No voiceover — bold kinetic typography + music + 2–3 embedded clips from your screen recording. Final MP4 saved to `/mnt/documents/career-boost-launch.mp4`.

### Brand system (from the uploaded logo)
- Navy `#0A1F44` (background), deep blue `#0E2A6B`, electric blue `#1E6BFF`, teal `#2BD4B0`, soft white `#F5F8FF`
- Display font: **Fraunces** (matches the logo's confident serif energy) for hero lines
- UI/body font: **Inter** for captions and stat labels
- Motion direction: **Kinetic Energy** — fast cuts, staggered character reveals, springy transitions, blue→teal gradient sweeps as the recurring motif

### Structure (~2,100 frames @ 30 fps ≈ 70s)

```text
 0–9s   Scene 1  Hook         "Applied to 50 jobs… still no interviews?"
 9–17s  Scene 2  Problem      Messy CV + ATS-REJECTED stamps thudding in
17–24s  Scene 3  Logo reveal  CB logo + tagline "Turn Applications Into Interviews"
24–45s  Scene 4  Product      3 trimmed clips from your screen recording with overlay captions
45–57s  Scene 6  Transform    ATS 42% → 84% animated ring, "Interview invitation" toast
57–70s  Scene 7  CTA          Pricing flash → "Start Free Today" → thecareerboost.com
```
(Scene 5 is intentionally skipped per your script.)

### Screen-recording handling
- `ffprobe` the 3-min recording (1920×1200, h264+aac, 179s) and pick three ~5s highlights — I'll scan frames to auto-locate: (a) upload/dashboard, (b) analysis in progress, (c) results view. Down-scaled/letterboxed to fit 1920×1080 inside a rounded-corner browser frame mock with subtle drop shadow and parallax pan.
- Audio from the recording is muted; a single licensed-style royalty-free background track (upbeat, builds to crescendo) plays throughout. Track file dropped in `remotion/public/audio/` — if you have a preferred track tell me, otherwise I'll use a CC-0 instrumental.

### Motion details per scene
- **Scene 1** — dim navy bg, single line of Fraunces text per-character spring stagger, faint scrolling "Rejected" email rows ghosting behind, vignette pulse on the question mark.
- **Scene 2** — angled CV mock (CSS, not an image), three red `ATS REJECTED` stamps thud in with rotation + shake, paper desaturates.
- **Scene 3** — logo zooms from 0.3→1 with spring overshoot, particle dots from the logo fan outward, tagline types in. Music shifts from minor to major (volume envelope cue).
- **Scene 4** — browser-chrome frame (traffic lights, URL bar showing thecareerboost.com), `<OffthreadVideo>` plays the trimmed clip, side caption panel slides in with the on-screen copy from your script.
- **Scene 6** — split before/after: animated circular progress ring counts 42→84, color morphs red→teal, toast notification "🎉 Interview invitation" springs in, then 3 stacked stat lines stagger ("More Visibility / Confidence / Interviews").
- **Scene 7** — three pricing cards fan in, dissolve into a giant CTA pill that pulses, URL `www.thecareerboost.com` underlines via clip-path, final tagline.

### Implementation
- Extend the existing `/remotion` project (it already has `MainVideo`, transitions, fonts setup). Add a new composition `id="launch"` so the old `main` composition stays renderable.
- New files:
  - `remotion/src/launch/LaunchVideo.tsx` (TransitionSeries wiring)
  - `remotion/src/launch/theme.ts` (logo palette)
  - `remotion/src/launch/scenes/Scene1Hook.tsx … Scene7CTA.tsx`
  - `remotion/src/launch/components/BrowserFrame.tsx`, `AtsRing.tsx`, `CvMock.tsx`
  - `remotion/public/clips/cb-1.mp4`, `cb-2.mp4`, `cb-3.mp4` (trimmed via ffmpeg from the upload)
  - `remotion/public/audio/launch-music.mp3`
- Register the new composition in `remotion/src/Root.tsx`.
- Render with the existing `scripts/render-remotion.mjs` (override composition id + output path) → `/mnt/documents/career-boost-launch.mp4`.
- After render, ffprobe + extract 5 still frames for spot-checks; fix any layout issues before delivering.

### Deliverable
- `career-boost-launch.mp4` (1920×1080, ~70s, H.264, with music) presented via `<presentation-artifact>` so you can download it.
- All Remotion source committed under `remotion/src/launch/` so we can iterate (swap clips, tweak copy, re-export 9:16 vertical later).

### Out of scope (call out if you want them)
- 9:16 vertical cut for Reels/TikTok
- Spoken voiceover (you opted for text + music)
- Subtitle/caption file (.srt) export
