// Builds carousel-mix.mp3: music + SFX at the same offsets used by CarouselVideo.tsx
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const A = path.resolve(__dirname, "../public/audio");

// All times in seconds. 30fps, 150 frames per scene = 5s per scene.
const cues = [
  // music bed
  { file: "carousel-music.mp3", at: 0, vol: 0.55 },
  // swipes between slides
  ...[1, 2, 3, 4, 5].map((i) => ({ file: "swipe.mp3", at: i * 5 - 0.27, vol: 0.7 })),
  // stamp on slide 2
  { file: "stamp.mp3", at: 5 + 73 / 30, vol: 0.9 },
  // chip pops on slide 3
  ...[20, 28, 36, 44, 52].map((f) => ({ file: "chip-pop.mp3", at: 10 + f / 30, vol: 0.45 })),
  // success on slide 5
  { file: "carousel-success.mp3", at: 20 + 35 / 30, vol: 0.9 },
  // CTA on slide 6
  { file: "carousel-cta.mp3", at: 25 + 4 / 30, vol: 0.9 },
];

const inputs = cues.map((c) => `-i ${path.join(A, c.file)}`).join(" ");
const filters = cues
  .map((c, i) => {
    const delayMs = Math.round(c.at * 1000);
    return `[${i}:a]volume=${c.vol},adelay=${delayMs}|${delayMs}[a${i}]`;
  })
  .join(";");
const mixInputs = cues.map((_, i) => `[a${i}]`).join("");
const cmd = `ffmpeg -y ${inputs} -filter_complex "${filters};${mixInputs}amix=inputs=${cues.length}:duration=longest:normalize=0,afade=t=out:st=29.5:d=0.5" -t 30 -b:a 192k ${path.join(A, "carousel-mix.mp3")}`;

console.log(cmd);
execSync(cmd, { stdio: "inherit" });
console.log("built carousel-mix.mp3");
