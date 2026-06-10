// Shared plan config — single source of truth for tier metadata,
// limits, and Flutterwave pricing.

export type PlanTier = "free" | "pro_1" | "pro_2" | "pro_legacy";

export type PlanDef = {
  id: PlanTier;
  name: string;
  subtitle: string;
  priceNGN: number;          // amount charged via Flutterwave
  priceLabel: string;        // pretty NGN label e.g. "₦4,900"
  priceUSD: number;          // amount charged via Paddle (whole dollars)
  priceLabelUSD: string;     // pretty USD label e.g. "$10"
  paddlePriceId?: string;    // human-readable Paddle price ID (created in catalog)
  period: string;
  monthlyLimit: number | null; // null = unlimited
  featured?: boolean;
  badge?: string;
  cta: string;
  features: string[];
  notIncluded?: string[];
};

export const PLANS: Record<Exclude<PlanTier, "pro_legacy">, PlanDef> = {
  free: {
    id: "free",
    name: "Free",
    subtitle: "Get started with basic insights.",
    priceNGN: 0,
    priceLabel: "₦0",
    period: "",
    monthlyLimit: 1,
    cta: "Get Started",
    features: [
      "1 CV Analysis per month",
      "ATS Score",
      "Basic Resume Assessment",
    ],
    notIncluded: [
      "Optimized Resume Generation",
      "Cover Letter Generation",
      "CV Strength & Weakness Analysis",
      "Missing Keyword Recommendations",
    ],
  },
  pro_1: {
    id: "pro_1",
    name: "Pro Plan 1",
    subtitle: "For job seekers.",
    priceNGN: 5000,
    priceLabel: "₦5,000",
    period: "/ month",
    monthlyLimit: 10,
    featured: true,
    badge: "Most Popular",
    cta: "Upgrade to Pro",
    features: [
      "Run 10 CV Analyses",
      "ATS Score",
      "10 Optimized Cover Letters",
      "CV Strength & Weakness Analysis",
      "Missing Keyword Recommendations",
      "10 Optimized CV Generations",
    ],
  },
  pro_2: {
    id: "pro_2",
    name: "Pro Plan 2",
    subtitle: "For serious job seekers.",
    priceNGN: 10000,
    priceLabel: "₦10,000",
    period: "/ month",
    monthlyLimit: 20,
    cta: "Get Pro Plus",
    features: [
      "Run 20 CV Analyses",
      "ATS Score",
      "20 Optimized Cover Letters",
      "CV Strength & Weakness Analysis",
      "Missing Keyword Recommendations",
      "20 Optimized CV Generations",
      
      "Priority Processing",
    ],
  },
};

export const PLAN_ORDER: Array<keyof typeof PLANS> = ["free", "pro_1", "pro_2"];

export function getMonthlyLimit(tier: PlanTier): number | null {
  if (tier === "pro_legacy") return null; // grandfathered unlimited
  return PLANS[tier].monthlyLimit;
}

export function planLabel(tier: PlanTier): string {
  if (tier === "pro_legacy") return "Pro (Legacy)";
  return PLANS[tier].name;
}
