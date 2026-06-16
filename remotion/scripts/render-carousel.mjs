import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("Bundling…");
const bundled = await bundle({
  entryPoint: path.resolve(__dirname, "../src/index.ts"),
  webpackOverride: (c) => c,
});

const browser = await openBrowser("chrome", {
  browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH ?? "/bin/chromium",
  chromiumOptions: { args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"] },
  chromeMode: "chrome-for-testing",
});

const targets = [
  { id: "carousel-9x16", out: "/mnt/documents/career-boost-carousel-9x16.mp4" },
  { id: "carousel-1x1", out: "/mnt/documents/career-boost-carousel-1x1.mp4" },
];

for (const t of targets) {
  console.log("Rendering", t.id, "->", t.out);
  const composition = await selectComposition({
    serveUrl: bundled,
    id: t.id,
    puppeteerInstance: browser,
  });
  console.log("  frames:", composition.durationInFrames);
  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: "h264",
    outputLocation: t.out,
    puppeteerInstance: browser,
    muted: false,
    concurrency: 1,
  });
  console.log("  done");
}

await browser.close({ silent: false });
console.log("All done");
