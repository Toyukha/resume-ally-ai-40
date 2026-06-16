## Goal

Upgrade the existing Career Boost walkthrough video into a fully-finished launch asset: cinematic electronic score, layered UI sound effects, burned-in captions for sound-off viewing, and an embedded hero video on the homepage.

## 1. Audio production (ElevenLabs)

**Connector check first.** Verify ElevenLabs is linked via `standard_connectors--list_connections`; if not, prompt linking. Then call `api.elevenlabs.io` server-side.

**Background music** — one continuous ~90s track via `/v1/music`:
> "Modern tech SaaS launch score, pulsing electronic, driving synth arpeggios, soft 808 sub, rising tension into uplifting motivational crescendo at 60s, confident resolution at 85s, instrumental, no vocals, 90 seconds, 110 BPM"

**Sound effects** via `/v1/sound-generation`, generated as separate stems and placed on the timeline:
- `whoosh-transition.mp3` (0.6s) — between every scene cut
- `keyboard-type.mp3` (1.5s) — Scene 4 (job description typing)
- `upload-complete.mp3` (0.8s) — Scene 3 (CV upload success ding)
- `scan-pulse.mp3` (2.5s) — Scene 5 (AI analysis ring)
- `chat-pop.mp3` (0.4s) — Scene 7 (AI chat bubbles)
- `success-chime.mp3` (1.2s) — Scene 8 (interview invitation)
- `cta-impact.mp3` (1.0s) — Scene 9 (final logo)

All saved to `remotion/public/audio/` so Remotion's `<Audio>` can reference them via `staticFile()`. A small Node script (`remotion/scripts/generate-audio.mjs`) batches the generations and writes the files.

## 2. Captions (burned-in)

A new `remotion/src/walkthrough/Captions.tsx` component sits as a top layer in `WalkthroughVideo.tsx`. Caption cues are hard-coded as `{ from, duration, text }` tuples per scene (no SRT parsing needed — fully deterministic). Styling:
- Bottom-aligned, 8% from bottom (responsive scales)
- Black 80%-opacity rounded pill background, white text, Inter 600
- 6-frame fade in/out via `interpolate()`
- Auto-wrap to 2 lines on 9:16

Captions cover every overlay text from the brief verbatim (Hook, Intro, Step 1–3, AI Analysis, Optimization, AI Support, Success — using "Improve your chances" wording — and Closing CTA).

## 3. Audio timeline wiring

In `WalkthroughVideo.tsx`:
- Top-level `<Audio src={staticFile('audio/music.mp3')} volume={0.55} />` for the full duration
- Per-scene `<Sequence from={...}><Audio src={...} volume={...} /></Sequence>` for each SFX cue
- Music ducks to 0.35 during voice-over-style scenes via `interpolate(frame, [...], [...])` on the volume prop

## 4. Re-render all 3 variants

Update `remotion/scripts/render-walkthrough.mjs`:
- Remove `muted: true` from each `renderMedia` call
- Re-render `career-boost-walkthrough-16x9.mp4` (1920×1080)
- Re-render `career-boost-walkthrough-9x16.mp4` (1080×1920)
- Re-render `career-boost-walkthrough-4x5.mp4` (1080×1350)
- All to `/mnt/documents/`

## 5. Homepage hero embed

In `src/routes/index.tsx`, add the 16:9 video to the hero section:
- Upload `career-boost-walkthrough-16x9.mp4` via `lovable-assets create` → write `.asset.json` pointer to `src/assets/`
- Add `<video>` with `autoPlay`, `muted`, `loop`, `playsInline`, `poster` (still frame), and a "Watch with sound" unmute toggle button overlaid
- Reduced-motion fallback: poster image only, no autoplay
- Sits within the existing hero layout (does not replace headline/CTA — placed alongside or below per current design)

## Out of scope

- Voice-over narration (captions cover the messaging)
- Separate WhatsApp Status export (9:16 file already serves both Reels and Status)
- Subtitles file as a separate `.srt` download

## Deliverables

- 3 final MP4s in `/mnt/documents/` with music + SFX + burned captions
- Homepage hero playing the 16:9 cut on `/`
- Audio assets in `remotion/public/audio/` and the generator script committed for future re-renders
