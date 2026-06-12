import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/navbar";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — The Career Boost" },
      { name: "description", content: "How The Career Boost collects, uses, stores, and protects your personal information and uploaded documents." },
      { property: "og:title", content: "Privacy Policy — The Career Boost" },
      { property: "og:description", content: "How we handle your data at The Career Boost." },
      { property: "og:url", content: "https://thecareerboost.com/privacy" },
    ],
    links: [{ rel: "canonical", href: "https://thecareerboost.com/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <article className="container mx-auto max-w-3xl px-4 py-16">
        <p className="text-sm font-medium text-primary-glow">LEGAL</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: June 10, 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">1. Who we are</h2>
            <p>The Career Boost ("we", "us") operates thecareerboost.com and provides AI-powered resume optimization. For the purposes of data protection law, The Career Boost is the data controller of the personal data we collect and process. This policy explains what data we collect and how we use it.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">2. Information we collect and legal basis</h2>
            <p>We process personal data on the following legal bases:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li><strong>Account data</strong> (email, name, authentication identifiers) — <em>Legal basis: contract performance</em> — necessary to create and manage your account and provide the Service.</li>
              <li><strong>Uploaded content</strong> (resumes, CVs, and job descriptions you submit for analysis) — <em>Legal basis: contract performance</em> — necessary to deliver CV analyses, ATS scores, and optimized resumes.</li>
              <li><strong>Usage data</strong> (pages viewed, features used, analysis history, device and browser information) — <em>Legal basis: legitimate interest</em> — to operate, secure, and improve the Service.</li>
              <li><strong>Payment data</strong> — handled directly by Flutterwave (NGN) and Paddle (USD). We receive only the transaction status and the last 4 digits of cards — never full card numbers. <em>Legal basis: contract performance and legal obligation</em> — to process payments and meet tax and accounting requirements.</li>
              <li><strong>Transactional emails</strong> (sign-in, receipts, plan expiry) — <em>Legal basis: contract performance</em> — to deliver the Service. Marketing emails require your explicit consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">3. How we use it</h2>
            <ul className="list-disc space-y-1 pl-6">
              <li>To deliver CV analyses, ATS scores, optimized resumes, and cover letters.</li>
              <li>To operate, secure, and improve the Service.</li>
              <li>To process payments and prevent fraud.</li>
              <li>To send transactional emails (sign-in, receipts, plan expiry). We do not send marketing without your consent.</li>
            </ul>
            <p className="mt-2">We do <strong>not</strong> sell your personal data or use your uploaded documents to train AI models.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">4. Sharing</h2>
            <p>We share data only with vetted processors who help us run the Service:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Hosting & database: Lovable Cloud (Supabase).</li>
              <li>AI processing: model providers via the Lovable AI Gateway.</li>
              <li>Payments: Flutterwave (NGN), Paddle (USD, merchant of record for international transactions).</li>
              <li>Email delivery: our transactional email provider.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">5. Security</h2>
            <p>Data is encrypted in transit (TLS) and at rest. Access to production systems is restricted and logged. No system is perfectly secure — please use a strong, unique password.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">6. Retention</h2>
            <p>Account and analysis data are retained for as long as your account is active. You may request deletion at any time, after which we will remove your data within 30 days, subject to legal record-keeping requirements (e.g., tax records for payments).</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">7. Your rights</h2>
            <p>Depending on your jurisdiction, you may have the right to access, correct, port, or delete your personal data, and to object to certain processing. To exercise these rights, contact us via the <Link to="/support" className="text-primary-glow underline">Support</Link> page.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">8. Cookies</h2>
            <p>We use strictly necessary cookies to keep you signed in and remember preferences, and limited analytics cookies to understand product usage. You can clear cookies in your browser at any time.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">9. Children</h2>
            <p>The Service is not directed to children under 16. We do not knowingly collect data from children.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">10. Changes & contact</h2>
            <p>We will post material changes to this policy on this page. Questions? Reach us via the <Link to="/support" className="text-primary-glow underline">Support</Link> page.</p>
          </section>
        </div>
      </article>
    </div>
  );
}
