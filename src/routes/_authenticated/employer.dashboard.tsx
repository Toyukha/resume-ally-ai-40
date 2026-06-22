import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Briefcase, Users, Calendar, Trophy, Clock, Gauge, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEmployerCtx } from "./employer";
import { getDashboardSnapshot } from "@/lib/employer/dashboard.functions";
import { MatchScoreRing } from "@/components/jobs/match-score-ring";

export const Route = createFileRoute("/_authenticated/employer/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Employer" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { activeCompanyId, activeCompanyName } = useEmployerCtx();
  const fn = useServerFn(getDashboardSnapshot);
  const { data, isLoading } = useQuery({
    queryKey: ["employer-dashboard", activeCompanyId],
    queryFn: () => fn({ data: { companyId: activeCompanyId } }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">{activeCompanyName}</h1>
          <p className="text-sm text-muted-foreground">Recruitment overview</p>
        </div>
        <Button asChild variant="hero"><Link to="/employer/jobs/new"><Plus className="mr-1.5 h-4 w-4" /> Post a job</Link></Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi icon={Briefcase} label="Active jobs" value={data?.kpis.activeJobs ?? 0} loading={isLoading} />
        <Kpi icon={Users} label="Applicants" value={data?.kpis.totalApplicants ?? 0} loading={isLoading} />
        <Kpi icon={Calendar} label="Interviews" value={data?.kpis.interviewsScheduled ?? 0} loading={isLoading} />
        <Kpi icon={Trophy} label="Hired" value={data?.kpis.hired ?? 0} loading={isLoading} />
        <Kpi icon={Clock} label="Expiring soon" value={data?.kpis.expiringSoon ?? 0} loading={isLoading} />
        <Kpi icon={Gauge} label="Avg ATS" value={data?.kpis.averageAtsScore ?? 0} suffix="%" loading={isLoading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="bg-card-gradient p-5 lg:col-span-2">
          <h2 className="mb-3 font-display text-lg font-semibold">Top candidate matches</h2>
          {data?.topMatches.length ? (
            <ul className="space-y-3">
              {data.topMatches.map((m) => (
                <li key={m.applicationId} className="flex items-center gap-4 rounded-lg border border-border/60 bg-background/40 p-3">
                  <MatchScoreRing score={m.score} size={56} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{m.candidateName}</div>
                    <div className="truncate text-xs text-muted-foreground">{m.jobTitle}</div>
                    {m.summary && <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{m.summary}</div>}
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/employer/candidates/$id" params={{ id: m.applicationId }}>View</Link>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No applications scored yet. Top candidates will appear here as soon as people apply.
            </p>
          )}
        </Card>

        <Card className="bg-card-gradient p-5">
          <h2 className="mb-3 font-display text-lg font-semibold">Recent activity</h2>
          {data?.activity.length ? (
            <ul className="space-y-2">
              {data.activity.map((a) => (
                <li key={a.id} className="text-sm">
                  <div className="font-medium capitalize">{a.kind.replace(/_/g, " ")}</div>
                  <div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Activity will appear as your team posts jobs and reviews candidates.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, suffix, loading }: { icon: any; label: string; value: number | string; suffix?: string; loading?: boolean }) {
  return (
    <Card className="bg-card-gradient p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 font-display text-2xl font-bold">
        {loading ? "—" : value}{suffix && <span className="text-base text-muted-foreground">{suffix}</span>}
      </div>
    </Card>
  );
}
