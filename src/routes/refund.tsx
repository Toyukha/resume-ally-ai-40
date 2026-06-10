import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/navbar";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "Refund Policy — Career Boost" },
      { name: "description", content: "How refunds work for Career Boost Pro plans paid via Flutterwave or Paddle." },
      { property: "og:title", content: "Refund Policy — Career Boost" },
      { property: "og:description", content: "Our refund policy for Career Boost Pro plans." },
      { property: "og:url", content: "https://thecareerboost.com/refund" },
    ],
    links: [{ rel: "canonical", href: "https://thecareerboost.com/refund" }],
  }),
  component: RefundPage,
});

function RefundPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <article className="container mx-auto max-w-3xl px-4 py-16">
        <p className="text-sm font-medium text-primary-glow">LEGAL</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Refund Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: June 10, 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">Overview</h2>
            <p>Career Boost delivers Pro features instantly — the moment your payment is confirmed, your account is upgraded and you can use analyses, optimized resumes, and cover letters. Because these are digital services consumed in real time, our refund policy is intentionally simple.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">1. 7-day refund window (unused plans)</h2>
            <p>If you have <strong>not used any Pro analysis</strong> in your current 30-day window, you may request a full refund within <strong>7 days</strong> of the payment date. Refunds are issued back to the original payment method.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">2. Used plans</h2>
            <p>Once you have run any Pro analysis (CV analysis, optimized resume, cover letter, or keyword report) within your active plan, the plan is considered delivered and is non-refundable.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">3. Duplicate or failed charges</h2>
            <p>If you were charged twice or your account was not upgraded after a successful payment, we will issue a full refund or fix the account within 2 business days of being notified.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">4. How to request a refund</h2>
            <p>Contact us via the <Link to="/support" className="text-primary-glow underline">Support</Link> page (WhatsApp) with:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>The email address on your account</li>
              <li>The date and amount of the charge</li>
              <li>A brief reason for the refund request</li>
            </ul>
            <p className="mt-2">Refunds typically arrive within <strong>5–10 business days</strong>, depending on your bank or card issuer.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">5. Payment processors</h2>
            <p>Local payments (NGN) are processed by Flutterwave and refunded to the original card or bank account. International payments (USD) are processed by Paddle, who acts as the merchant of record and issues refunds on our behalf.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">6. Chargebacks</h2>
            <p>Please contact us before filing a chargeback — most issues can be resolved within hours. Fraudulent chargebacks may result in account suspension.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">7. Free plan</h2>
            <p>The Free plan is, well, free — there is nothing to refund.</p>
          </section>
        </div>
      </article>
    </div>
  );
}
