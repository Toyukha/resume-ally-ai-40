import { supabase } from "@/integrations/supabase/client";

export type PwaEvent =
  | "prompt_shown"
  | "prompt_accepted"
  | "prompt_dismissed"
  | "ios_hint_shown"
  | "ios_hint_dismissed"
  | "installed"
  | "first_dashboard_visit_installed";

const SESSION_KEY = "cb_pwa_session_id";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = window.sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    window.sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function detectPlatform(): string {
  if (typeof window === "undefined") return "unknown";
  const ua = window.navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  if (/Windows/.test(ua)) return "windows";
  if (/Macintosh/.test(ua)) return "macos";
  if (/Linux/.test(ua)) return "linux";
  return "other";
}

/** Fire-and-forget PWA funnel event. Never throws. */
export async function trackPwaEvent(event: PwaEvent): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const { data } = await supabase.auth.getSession();
    await supabase.from("pwa_events").insert({
      event,
      platform: detectPlatform(),
      user_agent: window.navigator.userAgent.slice(0, 500),
      session_id: getSessionId(),
      user_id: data.session?.user?.id ?? null,
    });
  } catch {
    // swallow — analytics must not break UX
  }
}
