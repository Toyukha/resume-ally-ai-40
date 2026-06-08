import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, HelpCircle, FileText, Mail, Clock, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/navbar";
import { WhatsAppButton } from "@/components/whatsapp-button";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support — Get That Job" },
      { name: "description", content: "Get help with your resume, job applications, and account. Contact us via WhatsApp for quick assistance." },
      { property: "og:title", content: "Support — Get That Job" },
      { property: "og:description", content: "Get help with your resume, job applications, and account. Contact us via WhatsApp for quick assistance." },
      { property: "og:url", content: "https://thecareerboost.com/support" },
    ],
    links: [{ rel: "canonical", href: "https://thecareerboost.com/support" }],
  }),
  component: SupportPage,
});

const SUPPORT_CARDS = [
  {
    icon: FileText,
    title: "Resume Help",
    desc: "Need help uploading or understanding your resume analysis? We will walk you through it.",
  },
  {
    icon: HelpCircle,
    title: "Account Questions",
    desc: "Issues with billing, subscriptions, or your account settings? Let us know.",
  },
  {
    icon: Mail,
    title: "Feature Requests",
    desc: "Have an idea to make Get That Job better? We would love to hear it.",
  },
  {
    icon: Shield,
    title: "Privacy & Security",
    desc: "Questions about how we handle your data? We are fully transparent.",
  },
];

function SupportPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-4xl px-4 py-10">
        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <Clock className="h-3 w-3 text-gold" />
            Average response time: under 2 hours
          </div>
          <h1 className="font-display text-4xl font-bold md:text-5xl">How can we help you?</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Our team is ready to assist you with your CV, job applications, and any questions about Get That Job.
          </p>
        </div>

        {/* WhatsApp CTA */}
        <Card className="mb-10 overflow-hidden border-[#25D366]/30 bg-[#25D366]/5 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-md">
            <MessageCircle className="h-7 w-7" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold">Chat with us on WhatsApp</h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            The fastest way to get help. Send us a message and we will reply as soon as possible.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <WhatsAppButton
              variant="inline"
              label="Start WhatsApp Chat"
              location="support_page_cta"
              className="px-6 py-3 text-base"
            />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">+234 813 890 8924</p>
        </Card>

        {/* Support Topics */}
        <div className="grid gap-4 sm:grid-cols-2">
          {SUPPORT_CARDS.map((c) => (
            <Card key={c.title} className="p-6 transition-all hover:shadow-md">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary-glow">
                <c.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold">{c.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
            </Card>
          ))}
        </div>

        {/* Quick help */}
        <Card className="mt-10 p-8 text-center">
          <h3 className="font-display text-xl font-semibold">Still need help?</h3>
          <p className="mt-2 text-muted-foreground">
            Our support team is available Monday–Saturday, 9am–6pm WAT.
          </p>
          <div className="mt-6">
            <WhatsAppButton
              variant="inline"
              label="Message us on WhatsApp"
              location="support_page_footer"
            />
          </div>
        </Card>
      </main>
    </div>
  );
}
