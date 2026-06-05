import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles, FileText, Target, Wand2, Shield, Zap,
  CheckCircle2, ArrowRight, Star, HelpCircle, MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { Navbar } from "@/components/navbar";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Get That Job — AI Resume Optimizer for Modern Job Seekers" },
      { name: "description", content: "Tailor your resume to any job in seconds. ATS-friendly optimization, missing-keyword detection, and AI-generated cover letters." },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Target, title: "ATS Match Score", desc: "Instantly see how well your resume matches a target job — backed by recruiter-grade analysis." },
  { icon: Wand2, title: "AI Optimization", desc: "Rewrite your resume with tailored phrasing, strong verbs, and the keywords that matter." },
  { icon: FileText, title: "Cover Letter Generator", desc: "Get a polished, role-specific cover letter that sounds like you — not a robot." },
  { icon: Zap, title: "Lightning Fast", desc: "Upload a PDF or DOCX, paste the job spec, and get results in under a minute." },
  { icon: Shield, title: "Private by Design", desc: "Your documents never leave your account. Encrypted in transit and at rest." },
  { icon: Sparkles, title: "Modern AI Models", desc: "Powered by the latest frontier models for nuanced, recruiter-quality output." },
];

const PRICING = [
  { name: "Free", price: "₦0", period: "", desc: "Get started with basic insights.", features: ["1 CV analysis / month", "Basic ATS score", "No optimized resume generation", "No cover letter generation"], cta: "Get started", variant: "outline" as const },
  { name: "Pro", price: "₦5,000", period: "/ month", desc: "For serious job seekers.", features: ["Unlimited CV analyses", "ATS optimization", "Unlimited cover letters", "Missing keyword recommendations", "CV rewrite suggestions", "Analysis history"], cta: "Start Pro trial", variant: "hero" as const, featured: true },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-40">
          <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-hero blur-3xl opacity-30" />
        </div>
        <div className="container mx-auto px-4 pt-20 pb-24 md:pt-32 md:pb-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3 w-3 text-gold" />
              Get a job in 1 month
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
              Land more interviews with a <span className="text-gradient">resume that actually fits</span>.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Now, sit back and relax while we prepare a professional resume and cover letter that will help you secure your dream job.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" variant="hero" asChild>
                <Link to="/dashboard">
                  Upload your resume <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <a href="#features">See how it works</a>
              </Button>
            </div>
            <div className="mt-10 flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-gold text-gold" />)}
                <span className="ml-2">Get more value for less</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary-glow">FEATURES</p>
          <h2 className="mt-2 font-display text-4xl font-bold md:text-5xl">Built for today’s local and international recruitment standards.</h2>
          <p className="mt-4 text-muted-foreground">Ensure your application passes every screening stage with confidence.</p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="bg-card-gradient group relative overflow-hidden p-6 transition-all hover:shadow-elegant">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary-glow transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container mx-auto px-4 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary-glow">PRICING</p>
          <h2 className="mt-2 font-display text-4xl font-bold md:text-5xl">Simple plans. Real results.</h2>
          <p className="mt-4 text-muted-foreground">Start free. Upgrade when you're ready to job-hunt seriously.</p>
        </div>
        <div className="mx-auto mt-16 grid max-w-4xl gap-6 md:grid-cols-2">
          {PRICING.map((p) => (
            <Card
              key={p.name}
              className={`relative p-8 ${p.featured ? "border-primary-glow shadow-elegant scale-[1.02]" : ""}`}
            >
              {p.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-gold-foreground">
                  Most popular
                </div>
              )}
              <h3 className="font-display text-lg font-semibold">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-5xl font-bold">{p.price}</span>
                <span className="text-sm text-muted-foreground">{p.period}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-8 w-full" variant={p.variant} asChild>
                <Link to="/auth">{p.cta}</Link>
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container mx-auto px-4 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-primary-glow">FAQ</p>
          <h2 className="mt-2 font-display text-4xl font-bold md:text-5xl">Questions? Answered.</h2>
          <p className="mt-4 text-muted-foreground">Everything you need to know about Get That Job.</p>
        </div>
        <div className="mx-auto mt-12 max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="q1">
              <AccordionTrigger>What file formats can I upload?</AccordionTrigger>
              <AccordionContent>
                We support PDF and DOCX files. Make sure your resume is text-based (not a scanned image) so our AI can read and optimize it accurately.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2">
              <AccordionTrigger>How does the AI match score work?</AccordionTrigger>
              <AccordionContent>
                Our AI compares your resume against the job description, analyzing keyword overlap, skills alignment, experience relevance, and formatting quality. The score is a percentage — higher is better — and comes with specific improvement suggestions.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3">
              <AccordionTrigger>Is my data private and secure?</AccordionTrigger>
              <AccordionContent>
                Absolutely. Your documents are encrypted in transit and at rest. They are tied to your account and never shared with third parties. We do not use your resume to train models.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q4">
              <AccordionTrigger>Can I export the optimized resume?</AccordionTrigger>
              <AccordionContent>
                Yes. Pro plan lets you copy or download the AI-optimized resume and cover letter. You can paste them directly into job portals or export as clean text.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q5">
              <AccordionTrigger>How long does an analysis take?</AccordionTrigger>
              <AccordionContent>
                Most analyses complete in under 60 seconds. Complex resumes or very detailed job descriptions may take a minute or two at most.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q6">
              <AccordionTrigger>What is the difference between the plans?</AccordionTrigger>
              <AccordionContent>
                Free gives you 1 CV analysis per month with a basic ATS score. Pro unlocks unlimited CV analyses, ATS optimization, unlimited cover letters, missing keyword recommendations, CV rewrite suggestions, and full analysis history.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="container mx-auto px-4 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <MessageCircle className="h-3 w-3 text-gold" />
            We are here to help
          </div>
          <h2 className="font-display text-4xl font-bold md:text-5xl">You can reach out to us</h2>
          <p className="mt-4 text-muted-foreground">
            Have a question, feedback, or need help with your account? Drop us a message on WhatsApp and we will get back to you quickly.
          </p>
          <Button size="lg" variant="hero" className="mt-8" asChild>
            <a
              href="https://wa.me/2348138908924?text=Hello%2C%20I%20would%20like%20assistance%20with%20my%20CV%20and%20job%20application."
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                window.open(e.currentTarget.href, "_blank", "noopener,noreferrer");
              }}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Chat on WhatsApp
            </a>
          </Button>
          <p className="mt-3 text-sm text-muted-foreground">+234 813 890 8924</p>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-24">
        <Card className="bg-hero overflow-hidden p-12 text-center shadow-elegant md:p-16">
          <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-5xl">
            Your next role is one upload away.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
            Free to start. No credit card. Just better callbacks.
          </p>
          <Button size="lg" variant="gold" className="mt-8" asChild>
            <Link to="/dashboard">
              Optimize my resume <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </section>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 flex flex-col items-center gap-3 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Get That Job. Crafted for serious job seekers.
          </p>
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            <ShieldCheck className="h-3 w-3" />
            Admin Login
          </Link>
        </div>
      </footer>
    </div>
  );
}
