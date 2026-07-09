export const WHATSAPP_NUMBER = "2348138908924";
export const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/IgutFNzG4xXAMSCoo6bpcf";

export function getWhatsAppUrl() {
  return `https://wa.me/${WHATSAPP_NUMBER}`;
}

export function trackWhatsAppClick(location: string) {
  try {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "whatsapp_click", {
        event_category: "engagement",
        event_label: location,
      });
    }
    // Also log to console for debugging / custom analytics pipelines
    // eslint-disable-next-line no-console
    console.log("[Analytics] WhatsApp click:", { location, timestamp: new Date().toISOString() });
  } catch {
    // Silently fail if analytics is unavailable
  }
}

export function trackWhatsAppGroupClick(location: string) {
  try {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "whatsapp_group_click", {
        event_category: "engagement",
        event_label: location,
      });
    }
    // eslint-disable-next-line no-console
    console.log("[Analytics] WhatsApp group click:", { location, timestamp: new Date().toISOString() });
  } catch {
    // Silently fail if analytics is unavailable
  }
}

export function trackJobWhatsAppShare(location: string) {
  try {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "job_share_whatsapp", {
        event_category: "engagement",
        event_label: location,
      });
    }
    // eslint-disable-next-line no-console
    console.log("[Analytics] Job WhatsApp share:", { location, timestamp: new Date().toISOString() });
  } catch {
    // Silently fail if analytics is unavailable
  }
}

