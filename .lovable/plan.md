## Fix pricing in motion graphic

Replace the placeholder pricing tiers in `remotion/src/features/Scene6PricingChat.tsx` with the actual plans from `src/lib/plans.ts`, then re-render the MP4.

### Updated tier data (matching `src/lib/plans.ts`)


| Plan           | Price               | Featured       | Bullets shown                                           |
| -------------- | ------------------- | -------------- | ------------------------------------------------------- |
| **Free**       | ₦0                  | —              | 1 CV Analysis/mo · ATS Score · Basic Assessment         |
| **Pro Plan 1** | ₦5,000 /mo ($3.67)  | ★ Most Popular | 10 CV Analyses · 10 Cover Letters · 10 Optimized CVs    |
| **Pro Plan 2** | ₦10,000 /mo ($7.35) | —              | 20 CV Analyses · 20 Optimized CVs · Priority Processing |


### Edits

- Update the `TIERS` array in `Scene6PricingChat.tsx`:
  - Names: "Free", "Pro Plan 1", "Pro Plan 2"
  - Prices: "₦0", "₦5,000", "₦10,000" with "/ month" suffix on paid tiers
  - 3 trimmed feature bullets per tier (keep card compact at 1080p)
  - `featured: true` on Pro Plan 1 (matches `PLANS.pro_1.featured`)
- Keep the AI chat bubble, layout, animations, and timings unchanged.

### Re-render

- Run the existing `remotion/scripts/render-features.mjs` (silent), then mux back in the already-generated `features-track.mp3` with system ffmpeg.
- Overwrite `/mnt/documents/career-boost-features.mp4`.

No changes to website code, audio, or other scenes.