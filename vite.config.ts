// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import path from "node:path";
import { loadEnv } from "vite";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Load server-only env vars (no prefix) into process.env so server routes can
// read SUPABASE_SERVICE_ROLE_KEY and other non-VITE_ secrets.
const serverEnv = loadEnv(process.env.NODE_ENV || "development", process.cwd(), "");
Object.assign(process.env, serverEnv);

// htmlparser2@8 imports `entities/lib/*` (entities@4 layout), but parse5/jsdom
// hoist entities@8 to the top level (which uses `dist/` and has no `lib/`).
// Redirect the legacy deep paths to htmlparser2's nested entities@4 copy.
const nestedEntities = path.resolve(
  process.cwd(),
  "node_modules/htmlparser2/node_modules/entities",
);

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    resolve: {
      alias: {
        "entities/lib/decode.js": path.join(nestedEntities, "lib/decode.js"),
        "entities/lib/encode.js": path.join(nestedEntities, "lib/encode.js"),
      },
    },
  },
});
