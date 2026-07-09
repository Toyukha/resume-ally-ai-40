import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  Sparkles, FileText, Target, Wand2, Shield, Zap,
  CheckCircle2, ArrowRight, Star, Volume2, VolumeX,
  ShieldCheck, Play, Globe, CreditCard,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { WhatsAppGroupBanner } from "@/components/whatsapp-group-banner";

import { Navbar } from "@/components/navbar";
import walkthroughVideo from "@/assets/walkthrough.mp4.asset.json";
import walkthroughPoster from "@/assets/walkthrough-poster.jpg.asset.json";


const HOME_FAQ: Array<[string, string]> = [
  ["What file formats can I upload?", "We support PDF and DOCX files. Make sure your resume is text-based (not a scanned image) so our AI can read and optimize it accurately."],
  ["How does the AI match score work?", "Our AI compares your resume against the job description, analyzing keyword overlap, skills alignment, experience relevance, and formatting quality. The score is a percentage — higher is better — and comes with specific improvement suggestions."],
  ["Is my data private and secure?", "Absolutely. Your documents are encrypted in transit and at rest. They are tied to your account and never shared with third parties. We do not use your resume to train models."],
  ["Can I export the optimized resume?", "Yes. Pro plan lets you copy or download the AI-optimized resume and cover letter. You can paste them directly into job portals or export as clean text."],
  ["How long does an analysis take?", "Most analyses complete in under 60 seconds. Complex resumes or very detailed job descriptions may take a minute or two at most."],
  ["What is the difference between the plans?", "Free gives you 1 CV analysis per month with a basic ATS score. Pro Plan 1 (₦5,000/month) gives you 10 full analyses including optimized resume, cover letter, and missing-keyword report. Pro Plan 2 (₦10,000/month) doubles that to 20 analyses per month and adds priority processing."],
  ["How do payments work?", "Pro plans are billed as a one-time monthly payment via Flutterwave (₦5,000 or ₦10,000). Each payment unlocks the plan for 30 days — there is no automatic renewal, so you stay in control of your budget."],
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Career Boost — AI Resume Optimizer for Modern Job Seekers" },
      { name: "description", content: "Tailor your resume to any job in seconds. ATS-friendly optimization, missing-keyword detection, and AI-generated cover letters." },
      { property: "og:title", content: "Career Boost — AI Resume Optimizer for Modern Job Seekers" },
      { property: "og:description", content: "Tailor your resume to any job in seconds. ATS-friendly optimization, missing-keyword detection, and AI-generated cover letters." },
      { property: "og:url", content: "https://thecareerboost.com/" },
    ],
    links: [{ rel: "canonical", href: "https://thecareerboost.com/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: HOME_FAQ.map(([q, a]) => ({
            "@type": "Question",
            name: q,
            acceptedAnswer: { "@type": "Answer", text: a },
          })),
        }),
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Target, title: "ATS Match Score", desc: "Instantly see how well your resume matches a target job — backed by recruiter-grade analysis." },
  { icon: Wand2, title: "Resume Optimization", desc: "Rewrite your resume with tailored phrasing, strong verbs, and the keywords that matter." },
  { icon: FileText, title: "Cover Letter Generator", desc: "Get a polished, role-specific cover letter that sounds like you — not a robot." },
  { icon: Zap, title: "Lightning Fast", desc: "Upload a PDF or DOCX, paste the job spec, and get results in under a minute." },
  { icon: Shield, title: "Private by Design", desc: "Your documents never leave your account. Encrypted in transit and at rest." },
  { icon: Sparkles, title: "Recruiter quality", desc: "Powered by the latest frontier models for nuanced, recruiter-quality output." },
];

import { PLANS, PLAN_ORDER } from "@/lib/plans";

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

      {/* WhatsApp group announcement */}
      <section className="container mx-auto px-4 pb-8 md:pb-12">
        <WhatsAppGroupBanner location="landing" />
      </section>

      {/* Walkthrough video */}
      <WalkthroughSection />

      {/* Discovery: Trending Countries + Popular Career Paths */}
      <DiscoverySections />


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
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-medium text-gold-foreground backdrop-blur">
            <Sparkles className="h-3 w-3 text-gold" />
            Increase Your Chances of Landing Interviews with our Resume Optimization
          </div>
          <p className="text-sm font-medium text-primary-glow">PRICING</p>
          <h2 className="mt-2 font-display text-4xl font-bold md:text-5xl">Simple, Transparent Pricing</h2>
          <p className="mt-4 text-muted-foreground">Choose the plan that best fits your job search journey.</p>
        </div>

        {/* International payment callout */}
        <div className="relative mx-auto mt-12 mb-4 max-w-3xl overflow-hidden rounded-2xl border border-gold/40 bg-hero p-[2px] shadow-elegant">
          <div className="relative rounded-[14px] bg-card/95 px-6 py-6 backdrop-blur md:px-8 md:py-7">
            <div className="absolute -top-3 left-6 z-10 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2 text-sm font-black uppercase tracking-wider text-gold-foreground shadow-lg ring-2 ring-gold-foreground/20">
              <Globe className="h-5 w-5" /> Paying from outside Nigeria?
            </div>
            <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-elegant">
                <CreditCard className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-xl font-bold leading-tight md:text-2xl">
                  Select <span className="text-gradient">“Card”</span> at checkout to subscribe with any international card.
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Pay in seconds with any <strong className="text-foreground">Visa, Mastercard, Discover, Diners Club, and Verve</strong> — issued anywhere in the world. Your Pro plan activates instantly.
                </p>
                <div className="mt-3 rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-xs font-semibold text-foreground">
                  <span className="font-bold text-gold">Note:</span> The Naira equivalent of your currency will be deducted — not your local currency.
                  <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-bold">
                    <span>₦5,000 ≈ $3.67</span>
                    <span className="text-muted-foreground">|</span>
                    <span>₦10,000 ≈ $7.35</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-6xl items-stretch gap-6 md:grid-cols-3">

          {PLAN_ORDER.map((tier) => {
            const p = PLANS[tier];
            const isFeatured = !!p.featured;
            return (
              <Card
                key={tier}
                className={`relative flex flex-col p-8 transition-all hover:-translate-y-1 hover:shadow-elegant ${
                  isFeatured ? "border-primary-glow shadow-elegant md:scale-[1.04]" : ""
                }`}
              >
                {p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-gold-foreground shadow-sm">
                    {p.badge}
                  </div>
                )}
                <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.subtitle}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-bold">{p.priceLabel}</span>
                  <span className="text-sm text-muted-foreground">{p.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>{f}</span>
                    </li>
                  ))}
                  {p.notIncluded?.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60">✗</span>
                      <span className="line-through decoration-muted-foreground/40">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-auto w-full"
                  variant={isFeatured ? "hero" : tier === "pro_2" ? "gold" : "outline"}
                  asChild
                >
                  <Link to="/pricing">{p.cta}</Link>
                </Button>
              </Card>
            );
          })}
        </div>
        <div className="mt-10 text-center">
          <Link to="/pricing" className="text-sm font-medium text-primary-glow hover:underline">
            See full comparison & FAQ →
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container mx-auto px-4 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-primary-glow">FAQ</p>
          <h2 className="mt-2 font-display text-4xl font-bold md:text-5xl">Questions? Answered.</h2>
          <p className="mt-4 text-muted-foreground">Everything you need to know about Career Boost.</p>
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
                Free gives you 1 CV analysis per month with a basic ATS score. Pro Plan 1 (₦5,000/month) gives you 10 full analyses including optimized resume, cover letter, and missing-keyword report. Pro Plan 2 (₦10,000/month) doubles that to 20 analyses per month and adds priority processing.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q7">
              <AccordionTrigger>How do payments work?</AccordionTrigger>
              <AccordionContent>
                Pro plans are billed as a one-time monthly payment via Flutterwave (₦5,000 or ₦10,000). Each payment unlocks the plan for 30 days — there is no automatic renewal, so you stay in control of your budget.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="container mx-auto px-4 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3 w-3 text-gold" />
            We are here to help
          </div>
          <h2 className="font-display text-4xl font-bold md:text-5xl">Chat with our AI Assistant</h2>
          <p className="mt-4 text-muted-foreground">
            Get instant answers about pricing, payments, refunds, and how Career Boost works — 24/7. Need a human? Our assistant can hand you over to our team.
          </p>
          <Button
            size="lg"
            variant="hero"
            className="mt-8"
            onClick={() => window.dispatchEvent(new Event("careerboost:open-chat"))}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Chat with AI Assistant
          </Button>
          <p className="mt-3 text-sm text-muted-foreground">Available 24/7 · No waiting</p>
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
            © {new Date().getFullYear()} Career Boost. Crafted for serious job seekers.
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <Link to="/terms" className="inline-flex min-h-9 items-center px-2 py-2 hover:text-foreground transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="inline-flex min-h-9 items-center px-2 py-2 hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/refund" className="inline-flex min-h-9 items-center px-2 py-2 hover:text-foreground transition-colors">Refund Policy</Link>
            <Link to="/support" className="inline-flex min-h-9 items-center px-2 py-2 hover:text-foreground transition-colors">Support</Link>
          </nav>
          <Link
            to="/admin/login"
            className="inline-flex min-h-9 items-center gap-1.5 px-2 py-2 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            <ShieldCheck className="h-3 w-3" />
            Admin Login
          </Link>
        </div>
      </footer>
    </div>
  );
}

function WalkthroughSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [started, setStarted] = useState(false);

  const handleUnmute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    v.volume = 0.9;
    setMuted(false);
    void v.play();
  };

  const handleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    setMuted(true);
  };

  return (
    <section aria-label="Product walkthrough" className="container mx-auto px-4 pb-16 md:pb-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 text-center">
          <p className="text-sm font-medium text-primary-glow">SEE IT IN ACTION</p>
          <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">
            From application to <span className="text-gradient">interview invitation</span>.
          </h2>
          <p className="mt-3 text-muted-foreground">Watch how Career Boost tailors your resume in under a minute.</p>
        </div>
        <div className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-elegant">
          <video
            ref={videoRef}
            className="block aspect-video w-full"
            src={walkthroughVideo.url}
            poster={walkthroughPoster.url}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            onPlay={() => setStarted(true)}
          />
          <button
            type="button"
            onClick={muted ? handleUnmute : handleMute}
            aria-label={muted ? "Unmute walkthrough" : "Mute walkthrough"}
            className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-background/80 px-4 py-2 text-sm font-medium text-foreground backdrop-blur transition-all hover:bg-background"
          >
            {muted ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {muted ? "Watch with sound" : "Mute"}
          </button>
          {!started && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg">
                <Play className="h-6 w-6 translate-x-0.5 fill-current" />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const TRENDING_COUNTRIES = [
  { slug: "canada",  label: "Canada Jobs",  flag: "🇨🇦" },
  { slug: "uk",      label: "UK Jobs",      flag: "🇬🇧" },
  { slug: "us",      label: "USA Jobs",     flag: "🇺🇸" },
  { slug: "germany", label: "Germany Jobs", flag: "🇩🇪" },
  { slug: "remote",  label: "Remote Jobs",  flag: "🌍" },
] as const;

const POPULAR_PATHS = [
  { cat: "customer-success",      label: "Customer Success",     emoji: "💼" },
  { cat: "data-analysis",         label: "Data Analytics",       emoji: "📊" },
  { cat: "software-engineering",  label: "Software Engineering", emoji: "💻" },
  { cat: "ui-ux",                 label: "UI/UX Design",         emoji: "🎨" },
  { cat: "marketing",             label: "Digital Marketing",    emoji: "📈" },
  { cat: "sales",                 label: "Sales",                emoji: "🎯" },
] as const;

function DiscoverySections() {
  return (
    <section className="container mx-auto px-4 py-16 md:py-20">
      <div className="grid gap-10 md:grid-cols-2">
        {/* Trending Countries */}
        <div>
          <div className="mb-5">
            <p className="text-xs font-medium uppercase tracking-wider text-primary-glow">Trending Countries</p>
            <h3 className="mt-1 font-display text-2xl font-bold md:text-3xl">Find jobs where you want to work</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {TRENDING_COUNTRIES.map((c) => (
              <Link
                key={c.slug}
                to="/jobs/country/$country"
                params={{ country: c.slug }}
                className="group flex items-center gap-3 rounded-2xl border border-border bg-card/40 p-4 transition-all hover:-translate-y-0.5 hover:border-primary-glow/50 hover:bg-card/70 hover:shadow-glow"
              >
                <span className="text-3xl leading-none">{c.flag}</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{c.label}</div>
                  <div className="text-[11px] text-muted-foreground group-hover:text-primary-glow">Explore →</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Popular Career Paths */}
        <div>
          <div className="mb-5">
            <p className="text-xs font-medium uppercase tracking-wider text-gold">Popular Career Paths</p>
            <h3 className="mt-1 font-display text-2xl font-bold md:text-3xl">Built for in-demand roles</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {POPULAR_PATHS.map((p) => (
              <Link
                key={p.cat}
                to="/jobs"
                search={{ categories: [p.cat], page: 1 }}
                className="group flex items-center gap-3 rounded-2xl border border-border bg-card/40 p-4 transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:bg-card/70"
              >
                <span className="text-3xl leading-none">{p.emoji}</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{p.label}</div>
                  <div className="text-[11px] text-muted-foreground group-hover:text-gold">View jobs →</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


