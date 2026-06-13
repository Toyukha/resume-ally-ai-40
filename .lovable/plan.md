The WhatsApp links in the app use `getWhatsAppUrl()` which appends a `?text=` prefill parameter to `wa.me`. When opened, this redirects through `api.whatsapp.com`, which some browsers/networks block with `ERR_BLOCKED_BY_RESPONSE`.

Fix: simplify `getWhatsAppUrl()` in `src/lib/whatsapp.ts` to return a bare `https://wa.me/2348138908924` URL with no query parameters. This avoids the redirect chain that hits the blocked `api.whatsapp.com` endpoint.

Files changed:
- `src/lib/whatsapp.ts` — update `getWhatsAppUrl()` to return `https://wa.me/2348138908924`, remove `WHATSAPP_PREFILL` and its encoding logic

No other files need changes because every WhatsApp link in the app goes through `getWhatsAppUrl()`.