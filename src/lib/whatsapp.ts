export const WHATSAPP_NUMBER = "2348138908924";
export const WHATSAPP_PREFILL = "Hello I am interested in your services";

export function getWhatsAppUrl() {
  const encoded = encodeURIComponent(WHATSAPP_PREFILL);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
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

