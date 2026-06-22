import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Briefcase, Users, Calendar, Trophy, Clock, Gauge, Plus, UserPlus, Kanban, BarChart3, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEmployerCtx } from "./employer";
import { getDashboardSnapshot } from "@/lib/employer/dashboard.functions";
import { MatchScoreRing } from "@/components/jobs/match-score-ring";

export const Route = createFileRoute("/_authenticated/employer/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Employer" }] }),
  component: Dashboard,
});

const STAGE_LABELS: Record<string, string> = {
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};
const STAGE_ORDER = ["applied", "screening", "interview", "offer", "hired", "rejected"] as const;

function Dashboard() {
  const { activeCompanyId, activeCompanyName } = useEmployerCtx();
  const fn = useServerFn(getDashboardSnapshot);
  const { data, isLoading } = useQuery({
    queryKey: ["employer-dashboard", activeCompanyId],
    queryFn: () => fn({ data: { companyId: activeCompanyId } }),
  });

  const hasNoJobs = !isLoading && (data?.kpis.activeJobs ?? 0) === 0 && (data?.recentJobs.length ?? 0) === 0;
  const funnelMax = data ? Math.max(1, ...Object.values(data.funnel)) : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">{activeCompanyName}</h1>
          <p className="text-sm text-muted-foreground">Recruitment overview</p>
        </div>
        <Button asChild variant="hero"><Link to="/employer/jobs/new"><Plus className="mr-1.5 h-4 w-4" /> Post a job</Link></Button>
      </div>

      {/* Quick actions */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAction to="/employer/jobs/new" icon={Plus} label="Post a job" hint="Publish a new role" />
        <QuickAction to="/employer/team" icon={UserPlus} label="Invite teammate" hint="Add recruiters" />
        <QuickAction to="/employer/pipeline" icon={Kanban} label="View pipeline" hint="Move candidates" />
        <QuickAction to="/employer/analytics" icon={BarChart3} label="Analytics" hint="Hiring metrics" />
      </div>

      {hasNoJobs ? (
        <Card className="bg-card-gradient p-10 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary-glow">
            <Briefcase className="h-5 w-5" />
          </div>
          <h2 className="font-display text-xl font-semibold">Post your first job</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Your dashboard will fill up with applicants, ATS scores, and interview activity as soon as your first job is live.
          </p>
          <Button asChild variant="hero" className="mt-4">
            <Link to="/employer/jobs/new"><Plus className="mr-1.5 h-4 w-4" /> Post a job</Link>
          </Button>
        </Card>
      ) : null}

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
          <h2 className="mb-3 font-display text-lg font-semibold">Pipeline funnel</h2>
          {data ? (
            <ul className="space-y-2">
              {STAGE_ORDER.map((s) => {
                const count = data.funnel[s] ?? 0;
                const pct = Math.round((count / funnelMax) * 100);
                return (
                  <li key={s}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{STAGE_LABELS[s]}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="bg-card-gradient p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Jobs at a glance</h2>
            <Button asChild variant="ghost" size="sm"><Link to="/employer/jobs">All jobs <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button>
          </div>
          {data?.recentJobs.length ? (
            <ul className="divide-y divide-border/60">
              {data.recentJobs.map((j) => (
                <li key={j.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{j.title}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${j.status === "active" ? "bg-primary/10 text-primary-glow" : "bg-muted"}`}>{j.status}</span>
                      <span>{j.applicationCount} applicant{j.applicationCount === 1 ? "" : "s"}</span>
                      {j.deadline && <span>· deadline {new Date(j.deadline).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/employer/jobs/$id" params={{ id: j.id }}>View</Link>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No jobs yet.</p>
          )}
        </Card>

        <Card className="bg-card-gradient p-5">
          <h2 className="mb-3 font-display text-lg font-semibold">Recent activity</h2>
          {data?.activity.length ? (
            <ul className="space-y-2">
              {data.activity.map((a) => {
                const payload = (a.payload ?? {}) as Record<string, any>;
                const appId = payload.application_id as string | undefined;
                const jobId = payload.job_id as string | undefined;
                const inner = (
                  <>
                    <div className="font-medium capitalize">{a.kind.replace(/_/g, " ")}</div>
                    <div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
                  </>
                );
                return (
                  <li key={a.id} className="text-sm">
                    {appId ? (
                      <Link to="/employer/candidates/$id" params={{ id: appId }} className="block rounded-md p-1 hover:bg-accent">{inner}</Link>
                    ) : jobId ? (
                      <Link to="/employer/jobs/$id" params={{ id: jobId }} className="block rounded-md p-1 hover:bg-accent">{inner}</Link>
                    ) : (
                      <div className="p-1">{inner}</div>
                    )}
                  </li>
                );
              })}
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

function QuickAction({ to, icon: Icon, label, hint }: { to: string; icon: any; label: string; hint: string }) {
  return (
    <Link to={to} className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 p-3 transition-colors hover:border-primary/40 hover:bg-accent">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary-glow">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}
