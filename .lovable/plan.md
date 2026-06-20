# Social Media Flyer — Career Boost

Generate a cohesive **3-flyer set** (one design adapted to each platform's required aspect ratio) promoting Career Boost sign-ups.

## Output

Three premium PNG flyers saved to `/mnt/documents/`:

1. `career-boost-flyer-1x1.png` — **1080×1080** (Instagram / Facebook feed)
2. `career-boost-flyer-9x16.png` — **1080×1920** (Stories / Reels / TikTok)
3. `career-boost-flyer-16x9.png` — **1920×1080** (LinkedIn / X / Twitter)

Each rendered with the **premium** image-gen tier (needed for legible typography).

## Visual direction — Dark & Bold

- **Palette:** deep navy `#0A0F2C` → black `#0F172A` background, **electric blue `#3B82F6`** primary, **gold `#F5C26B`** accent, ivory `#F5F8FF` text.
- **Mood:** premium executive, late-night ambition, subtle gold foil + glowing blue gradient orbs, faint grid texture — same energy as the existing landing hero.
- **Motif:** a glowing résumé document tilted in 3D, with an ATS match-score ring (gold) hovering beside it; soft particle/spark accents.
- **Typography:** bold sans-serif display headline, thin uppercase eyebrow, small CTA chip.

## Copy on the flyer

- Eyebrow chip: `✦ AI RESUME OPTIMIZER`
- Headline: **"Land more interviews."**
- Sub: *"Tailor your resume to any job in seconds — ATS-ready, recruiter-quality, in under a minute."*
- Bullet pills (3): `ATS Match Score` · `AI Cover Letters` · `Jobs Marketplace`
- CTA button: **`Sign up free →`**
- URL footer: `thecareerboost.com`

## Technical notes

- Use `imagegen--generate_image` with `model: "premium"` for each format (text legibility).
- Pass `transparent_background: false` (flyers need their dark backdrop).
- After generation, view each file to QA: check no garbled text, headline readable, URL legible, layout not clipped. Regenerate any that fail QA.
- Present each file to the user via `<presentation-artifact>` tags with `mime_type="image/png"`.

## Out of scope

- No code changes to the app.
- No video / animated version.
- No printed-flyer (A4/PDF) variant — purely social digital sizes.
