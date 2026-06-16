import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "../public/audio");
fs.mkdirSync(OUT, { recursive: true });

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) {
  console.error("ELEVENLABS_API_KEY missing");
  process.exit(1);
}

async function music(name, prompt, duration) {
  const target = path.join(OUT, name);
  if (fs.existsSync(target)) {
    console.log("skip", name);
    return;
  }
  console.log("music ->", name);
  const res = await fetch("https://api.elevenlabs.io/v1/music", {
    method: "POST",
    headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, music_length_ms: duration * 1000 }),
  });
  if (!res.ok) throw new Error(`${name}: ${res.status} ${await res.text()}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(target, buf);
  console.log("  wrote", buf.length, "bytes");
}

async function sfx(name, text, duration) {
  const target = path.join(OUT, name);
  if (fs.existsSync(target)) {
    console.log("skip", name);
    return;
  }
  console.log("sfx ->", name);
  const res = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
    method: "POST",
    headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ text, duration_seconds: duration, prompt_influence: 0.4 }),
  });
  if (!res.ok) throw new Error(`${name}: ${res.status} ${await res.text()}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(target, buf);
  console.log("  wrote", buf.length, "bytes");
}

await music(
  "carousel-music.mp3",
  "Modern tech SaaS pulse, driving synth arpeggio, soft sub bass, steady 120 BPM, building tension into confident uplifting resolution near the end, instrumental, no vocals, polished launch trailer energy",
  32,
);

await sfx("swipe.mp3", "Short crisp UI swipe whoosh transition, fast", 0.5);
await sfx("stamp.mp3", "Hard rubber stamp thud impact with paper", 0.6);
await sfx("chip-pop.mp3", "Soft UI bubble pop chip notification", 0.3);
await sfx("carousel-success.mp3", "Bright uplifting positive success chime, short sparkle", 1.0);
await sfx("carousel-cta.mp3", "Confident futuristic UI impact, deep low boom with sparkle", 0.9);

console.log("done");
