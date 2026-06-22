import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEmployerCtx } from "./employer";
import { getCompany } from "@/lib/employer/companies.functions";
import { PLAN_LIMITS, PLAN_ORDER, isUnlimited, type EmployerPlan } from "@/lib/employer/plan";

export const Route = createFileRoute("/_authenticated/employer/settings/plan")({
  head: () => ({ meta: [{ title: "Plan & usage — Employer" }] }),
  component: PlanPage,
});

function PlanPage() {
  const { activeCompanyId } = useEmployerCtx();
  const fn = useServerFn(getCompany);
  const { data } = useQuery({ queryKey: ["company", activeCompanyId], queryFn: () => fn({ data: { id: activeCompanyId } }) });
  const currentPlan = (data?.plan ?? "starter") as EmployerPlan;

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold">Plan & usage</h1>
      <p className="text-sm text-muted-foreground">Your workspace is on the <Badge variant="outline" className="ml-1 capitalize">{currentPlan}</Badge> plan.</p>

      <div className="grid gap-3 md:grid-cols-3">
        {PLAN_ORDER.map((p) => {
          const def = PLAN_LIMITS[p];
          const isCurrent = p === currentPlan;
          return (
            <Card key={p} className={`bg-card-gradient p-5 ${isCurrent ? "ring-2 ring-primary-glow" : ""}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">{def.label}</h3>
                {isCurrent && <Badge>Current</Badge>}
              </div>
              <ul className="mt-3 space-y-1.5 text-sm">
                <li>{isUnlimited(def.activeJobs) ? "Unlimited" : def.activeJobs} active jobs</li>
                <li>{isUnlimited(def.applicantsPerJob) ? "Unlimited" : def.applicantsPerJob} applicants / job</li>
                <li>{isUnlimited(def.teamMembers) ? "Unlimited" : def.teamMembers} team members</li>
                {def.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-muted-foreground"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-success" />{f}</li>
                ))}
              </ul>
              {!isCurrent && <Button variant="outline" className="mt-4 w-full" disabled>Contact sales</Button>}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
