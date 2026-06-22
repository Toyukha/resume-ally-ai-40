// Soft plan limits for the Employer Portal.
import type { Database } from "@/integrations/supabase/types";

export type EmployerPlan = Database["public"]["Enums"]["employer_plan"];

export const PLAN_LIMITS: Record<EmployerPlan, {
  label: string;
  activeJobs: number;          // -1 = unlimited
  applicantsPerJob: number;    // -1 = unlimited
  teamMembers: number;
  features: string[];
}> = {
  starter: {
    label: "Starter",
    activeJobs: 3,
    applicantsPerJob: 100,
    teamMembers: 2,
    features: ["Basic ATS scoring", "In-app applications", "Pipeline kanban"],
  },
  growth: {
    label: "Growth",
    activeJobs: 10,
    applicantsPerJob: -1,
    teamMembers: 10,
    features: ["AI candidate ranking", "Interview management", "Analytics"],
  },
  enterprise: {
    label: "Enterprise",
    activeJobs: -1,
    applicantsPerJob: -1,
    teamMembers: -1,
    features: ["Unlimited jobs", "Team collaboration", "Priority support"],
  },
};

export const PLAN_ORDER: EmployerPlan[] = ["starter", "growth", "enterprise"];

export function isUnlimited(n: number): boolean {
  return n < 0;
}
