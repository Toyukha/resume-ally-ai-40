import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  CheckCircle2, XCircle, Sparkles, ShieldCheck, Lock, Zap, Loader2, Crown, ArrowRight, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Navbar } from "@/components/navbar";
import { PLANS, PLAN_ORDER, type PlanTier } from "@/lib/plans";
import { initFlutterwavePayment } from "@/lib/flutterwave.functions";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PRICING_FAQ: Array<[string, string]> = [
  ["How does billing work?", "Pro Plan 1 and Pro Plan 2 cost ₦5,000 / $10 and ₦10,000 / $20 respectively. Local (Naira) payments go through Flutterwave as a one-time 30-day pass — no auto-renewal. International (USD) payments go through Paddle as an auto-renewing monthly subscription you can cancel any time from your dashboard."],
  ["How are monthly limits counted?", "Every CV analysis includes the matching ATS score, optimized resume, cover letter and missing-keyword report as one bundled credit. Pro Plan 1 gives you 10 of these per month; Pro Plan 2 gives you 20. Usage resets at the start of each calendar month."],
  ["What payment methods are supported?", "Flutterwave (NGN) supports Nigerian and international cards (Visa, Mastercard, Verve), bank transfer, USSD, and mobile money. Paddle (USD) supports Visa, Mastercard, Amex, Apple Pay, Google Pay, PayPal, and more."],
  ["Can I upgrade from Pro Plan 1 to Pro Plan 2?", "Yes. On Flutterwave, just purchase the higher plan and your new 30-day window starts immediately. On Paddle, switching plans is pro-rated automatically — you only pay the difference for the remainder of the current billing cycle."],
  ["Will I be auto-charged next month?", "Only on the USD/Paddle plan, which auto-renews monthly until you cancel. The NGN/Flutterwave plan is a one-time 30-day pass with no automatic renewal."],
  ["How do I cancel?", "USD/Paddle subscribers can cancel any time from the dashboard via the Manage button — you keep Pro access until the end of the period you already paid for. NGN/Flutterwave plans simply expire after 30 days; there is nothing to cancel."],
  ["Do you offer refunds?", "Yes. International (USD/Paddle) purchases are refundable within 14 days if unused. Local (NGN/Flutterwave) purchases are refundable within 7 days if unused. See the Refund Policy for full details."],
  ["Is my data private?", "Your documents are encrypted in transit and at rest, tied to your account, and never shared. We do not use your resume to train models."],
];

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Career Boost" },
      { name: "description", content: "Simple, transparent pricing for AI-powered CV optimization. Free plan, Pro Plan 1 (₦5,000), and Pro Plan 2 (₦10,000) — choose what fits your job search." },
      { property: "og:title", content: "Pricing — Career Boost" },
      { property: "og:description", content: "Choose the plan that best fits your job search journey. Free, Pro 1, and Pro 2." },
      { property: "og:url", content: "https://thecareerboost.com/pricing" },
    ],
    links: [{ rel: "canonical", href: "https://thecareerboost.com/pricing" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: PRICING_FAQ.map(([q, a]) => ({
            "@type": "Question",
            name: q,
            acceptedAnswer: { "@type": "Answer", text: a },
          })),
        }),
      },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const navigate = useNavigate();
  const [loadingTier, setLoadingTier] = useState<PlanTier | null>(null);
  const [currency, setCurrency] = useState<"NGN" | "USD">("NGN");
  const initFn = useServerFn(initFlutterwavePayment);
  const { openCheckout: openPaddle } = usePaddleCheckout();

  const startCheckout = useMutation({
    mutationFn: async (planTier: "pro_1" | "pro_2") => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        navigate({ to: "/auth", search: { redirect: "/pricing" } as never });
        throw new Error("redirect");
      }
      if (currency === "NGN") {
        return initFn({ data: { planTier } });
      }
      // USD via Paddle
      const plan = PLANS[planTier];
      if (!plan.paddlePriceId) throw new Error("USD checkout not configured");
      await openPaddle({
        priceId: plan.paddlePriceId,
        userId: session.session.user.id,
        customerEmail: session.session.user.email ?? undefined,
        planTier,
        successUrl: `${window.location.origin}/dashboard?upgraded=1`,
      });
      return { checkoutUrl: null as string | null };
    },
    onMutate: (planTier) => setLoadingTier(planTier),
    onSettled: () => setLoadingTier(null),
    onSuccess: (res) => {
      if (res?.checkoutUrl) window.location.href = res.checkoutUrl;
    },
    onError: (e) => {
      if (e instanceof Error && e.message === "redirect") return;
      toast.error(e instanceof Error ? e.message : "Could not start checkout");
    },
  });

  const onPick = async (tier: PlanTier) => {
    if (tier === "free") {
      const { data } = await supabase.auth.getSession();
      navigate({ to: data.session ? "/dashboard" : "/auth" });
      return;
    }
    if (tier === "pro_1" || tier === "pro_2") startCheckout.mutate(tier);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Banner */}
      <section className="border-b border-border/60 bg-hero">
        <div className="container mx-auto px-4 py-4 text-center">
          <p className="flex items-center justify-center gap-2 text-sm font-medium text-primary-foreground md:text-base">
            <Sparkles className="h-4 w-4 text-gold" />
            Increase Your Chances of Landing Interviews with our Resume Optimization
          </p>
        </div>
      </section>

      {/* Header */}
      <section className="container mx-auto px-4 pt-16 pb-10 text-center">
        <p className="text-sm font-medium text-primary-glow">PRICING</p>
        <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">
          Simple, Transparent Pricing
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Choose the plan that best fits your job search journey.
        </p>

        {/* Currency toggle */}
        <div className="mt-6 inline-flex items-center rounded-full border border-border bg-card p-1">
          <button
            type="button"
            onClick={() => setCurrency("NGN")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              currency === "NGN" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
            aria-pressed={currency === "NGN"}
          >
            ₦ NGN
          </button>
          <button
            type="button"
            onClick={() => setCurrency("USD")}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              currency === "USD" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
            aria-pressed={currency === "USD"}
          >
            <Globe className="h-3.5 w-3.5" /> USD
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {currency === "NGN"
            ? "Local payments in Naira via Flutterwave"
            : "International payments in USD via Paddle (auto-renewing)"}
        </p>
      </section>

      {/* Plans */}
      <section className="container mx-auto px-4 pb-20">
        <div className="mx-auto grid max-w-6xl items-stretch gap-6 md:grid-cols-3">
          {PLAN_ORDER.map((tier) => {
            const p = PLANS[tier];
            const isFeatured = !!p.featured;
            const busy = loadingTier === tier;
            return (
              <Card
                key={tier}
                className={`relative flex flex-col p-8 transition-all hover:-translate-y-1 hover:shadow-elegant ${
                  isFeatured
                    ? "border-primary-glow shadow-elegant md:scale-[1.04]"
                    : "border-border"
                }`}
              >
                {p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-gold-foreground shadow-sm">
                    {p.badge}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {tier === "pro_2" ? (
                    <Crown className="h-5 w-5 text-gold" />
                  ) : tier === "pro_1" ? (
                    <Zap className="h-5 w-5 text-primary-glow" />
                  ) : (
                    <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                  )}
                  <h3 className="font-display text-xl font-semibold">{p.name}</h3>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{p.subtitle}</p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-bold">
                    {currency === "USD" ? p.priceLabelUSD : p.priceLabel}
                  </span>
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
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
                      <span className="line-through decoration-muted-foreground/40">{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-8">
                  <Button
                    className="w-full"
                    size="lg"
                    variant={isFeatured ? "hero" : tier === "pro_2" ? "gold" : "outline"}
                    disabled={busy}
                    onClick={() => onPick(tier)}
                  >
                    {busy ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirecting…</>
                    ) : (
                      <>{p.cta} <ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                  {tier !== "free" && (
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                      {currency === "USD"
                        ? "Secured by Paddle · auto-renews monthly"
                        : "Secured by Flutterwave · 30 days access"}
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Trust badges */}
        <div className="mx-auto mt-14 flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Encrypted in transit & at rest</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> PCI-DSS payments via Flutterwave & Paddle</span>
          <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-gold" /> {currency === "USD" ? "Cancel any time from your dashboard" : "One-time payment — no auto-renewal"}</span>
        </div>
      </section>

      {/* Feature comparison */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Compare features</h2>
          <p className="mt-3 text-muted-foreground">A clear look at what each plan unlocks.</p>
        </div>

        <div className="mx-auto mt-10 max-w-5xl overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-4 text-left font-medium text-muted-foreground">Feature</th>
                <th className="py-4 text-center font-display font-semibold">Free</th>
                <th className="py-4 text-center font-display font-semibold text-primary-glow">Pro Plan 1</th>
                <th className="py-4 text-center font-display font-semibold text-gold">Pro Plan 2</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row) => (
                <tr key={row.label} className="border-b border-border/60">
                  <td className="py-3 pr-4">{row.label}</td>
                  <td className="py-3 text-center">{cell(row.free)}</td>
                  <td className="py-3 text-center">{cell(row.pro1)}</td>
                  <td className="py-3 text-center">{cell(row.pro2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-primary-glow">FAQ</p>
          <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">Frequently asked questions</h2>
        </div>
        <div className="mx-auto mt-10 max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {PRICING_FAQ.map(([q, a], i) => (
              <AccordionItem key={q} value={`q${i + 1}`}>
                <AccordionTrigger>{q}</AccordionTrigger>
                <AccordionContent>{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        <div className="mt-12 text-center">
          <Button variant="hero" size="lg" asChild>
            <Link to="/dashboard">Start optimizing your resume <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function cell(val: boolean | string | number) {
  if (val === true) return <CheckCircle2 className="mx-auto h-4 w-4 text-success" />;
  if (val === false) return <XCircle className="mx-auto h-4 w-4 text-muted-foreground/50" />;
  return <span className="font-medium">{val}</span>;
}

const COMPARE_ROWS: Array<{ label: string; free: boolean | string | number; pro1: boolean | string | number; pro2: boolean | string | number }> = [
  { label: "CV Analyses per month", free: "1", pro1: "10", pro2: "20" },
  { label: "ATS Score", free: true, pro1: true, pro2: true },
  { label: "Strength & Weakness Analysis", free: false, pro1: true, pro2: true },
  { label: "Missing Keyword Recommendations", free: false, pro1: true, pro2: true },
  { label: "Optimized Resume Generation", free: false, pro1: "10 / mo", pro2: "20 / mo" },
  { label: "Cover Letter Generation", free: false, pro1: "10 / mo", pro2: "20 / mo" },
  
  { label: "Priority Processing", free: false, pro1: false, pro2: true },
];
