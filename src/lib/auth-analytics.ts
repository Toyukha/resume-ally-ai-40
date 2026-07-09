// Client-side tracker for auth verification analytics.
// Writes rows into `public.auth_events` via the browser Supabase client.
import { supabase } from "@/integrations/supabase/client";

export type AuthAnalyticsEvent =
  | "verify_callback_success"
  | "verify_callback_failed"
  | "resend_verification_clicked"
  | "resend_verification_sent"
  | "resend_verification_failed";

const SESSION_KEY = "cb_auth_session_id";

function sessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

async function emailHash(email: string | null | undefined): Promise<string | null> {
  if (!email || typeof crypto === "undefined" || !crypto.subtle) return null;
  const bytes = new TextEncoder().encode(email.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function trackAuthEvent(
  event: AuthAnalyticsEvent,
  opts: { email?: string | null; metadata?: Record<string, unknown> } = {},
): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id ?? null;
    const row = {
      event,
      email_hash: await emailHash(opts.email ?? data.session?.user.email ?? null),
      user_id: userId,
      session_id: sessionId(),
      user_agent: navigator.userAgent.slice(0, 500),
      metadata: opts.metadata ?? {},
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("auth_events").insert(row);
  } catch (err) {
    console.warn("trackAuthEvent failed", err);
  }
}
