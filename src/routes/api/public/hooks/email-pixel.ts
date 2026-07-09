// 1x1 transparent GIF served to track verification-email opens.
// Called from the <img> pixel embedded in the signup email template.
// `e` = pre-computed sha256 hash of the recipient email (never plaintext).
// `t` = template name (e.g. "signup").

import { createFileRoute } from "@tanstack/react-router";

const PIXEL = Uint8Array.from([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00,
  0xff, 0xff, 0xff, 0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
  0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
]);

function pixelResponse() {
  return new Response(PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(PIXEL.byteLength),
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
    },
  });
}

export const Route = createFileRoute("/api/public/hooks/email-pixel")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const emailHash = url.searchParams.get("e");
          const template = url.searchParams.get("t") ?? "signup";
          if (!emailHash || !/^[a-f0-9]{64}$/i.test(emailHash)) {
            return pixelResponse();
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const ua = request.headers.get("user-agent")?.slice(0, 500) ?? null;
          await supabaseAdmin.from("auth_events").insert({
            event: "verification_email_opened",
            email_hash: emailHash.toLowerCase(),
            user_agent: ua,
            metadata: { template },
          });
        } catch (err) {
          console.warn("email-pixel log failed", err);
        }
        return pixelResponse();
      },
    },
  },
});
