import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { useEmployerCtx } from "./employer";
import { getAnalytics } from "@/lib/employer/analytics.functions";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

export const Route = createFileRoute("/_authenticated/employer/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Employer" }] }),
  component: Analytics,
});

const STAGE_COLORS = ["#3B82F6","#60A5FA","#93C5FD","#F5C26B","#A78BFA","#34D399","#22D3EE","#10B981","#EF4444"];

function Analytics() {
  const { activeCompanyId } = useEmployerCtx();
  const fn = useServerFn(getAnalytics);
  const { data, isLoading } = useQuery({ queryKey: ["employer-analytics", activeCompanyId], queryFn: () => fn({ data: { companyId: activeCompanyId } }) });

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold">Recruitment analytics</h1>
      {isLoading || !data ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Total applicants" value={data.total} />
            <Stat label="Average ATS score" value={`${data.avgScore}%`} />
            <Stat label="Avg time-to-hire" value={data.averageTimeToHire != null ? `${data.averageTimeToHire} days` : "—"} />
            <Stat label="Top performing jobs" value={data.perJob.length} />
          </div>

          <Card className="bg-card-gradient p-5">
            <h2 className="mb-3 font-display font-semibold">Hiring funnel</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.funnel}>
                  <XAxis dataKey="stage" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={70} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="count">
                    {data.funnel.map((_, i) => <Cell key={i} fill={STAGE_COLORS[i % STAGE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="bg-card-gradient p-5">
            <h2 className="mb-3 font-display font-semibold">Applications per job</h2>
            {data.perJob.length === 0 ? (
              <p className="text-sm text-muted-foreground">No applications yet.</p>
            ) : (
              <ul className="space-y-2">
                {data.perJob.map((j) => (
                  <li key={j.jobId} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm">
                    <span className="truncate">{j.title}</span>
                    <span className="font-semibold">{j.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="bg-card-gradient p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
    </Card>
  );
}
