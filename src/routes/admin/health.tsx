import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Activity, AlertTriangle, Cpu, Webhook, Clock, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getHealthSnapshot } from "@/lib/admin.functions";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

export const Route = createFileRoute("/admin/health")({
  head: () => ({ meta: [{ title: "System Health — Admin" }] }),
  component: AdminHealth,
});

function Stat({
  icon: Icon, label, value, hint, tone,
}: {
  icon: typeof Activity; label: string; value: string | number; hint?: string;
  tone?: "default" | "warn" | "danger" | "ok";
}) {
  const toneClass =
    tone === "danger" ? "text-destructive" :
    tone === "warn" ? "text-amber-600" :
    tone === "ok" ? "text-emerald-600" : "";
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className={`mt-2 font-display text-2xl font-bold ${toneClass}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}

function AdminHealth() {
  const fn = useServerFn(getHealthSnapshot);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-health"],
    queryFn: () => fn(),
    refetchInterval: 30_000, // refresh every 30s
  });

  if (isLoading || !data) {
    return <div className="text-sm text-muted-foreground">Loading system health…</div>;
  }

  const fmt = (n: number) => new Intl.NumberFormat().format(n);
  const tokensM = (n: number) => `${(n / 1_000_000).toFixed(2)}M`;
  const webhookTone = data.webhooks.failureRate >= 5
    ? "danger" : data.webhooks.failureRate >= 1 ? "warn" : "ok";
  const jobsTone = data.jobs.failed24h >= 10
    ? "danger" : data.jobs.failed24h > 0 ? "warn" : "ok";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">System Health</h1>
          <p className="text-sm text-muted-foreground">
            Live monitoring · auto-refresh every 30s · last updated {new Date(data.generatedAt).toLocaleTimeString()}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Throughput */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Analyses Throughput</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat icon={Clock} label="Last Hour" value={fmt(data.analysesLastHour)} />
          <Stat icon={Activity} label="Today" value={fmt(data.analysesToday)} />
          <Stat icon={Activity} label="Last 24h" value={fmt(data.analyses24h)} />
          <Stat icon={Activity} label="This Month" value={fmt(data.analysesMonth)} />
        </div>
      </div>

      {/* AI usage */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">AI Token Usage (estimated)</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <Stat icon={Cpu} label="Tokens / analysis" value={fmt(data.tokensEstimate.perAnalysis)} hint="Rough estimate (input + output)" />
          <Stat icon={Cpu} label="Tokens last 24h" value={tokensM(data.tokensEstimate.last24h)} />
          <Stat icon={Cpu} label="Tokens this month" value={tokensM(data.tokensEstimate.thisMonth)} hint="Watch credit burn vs revenue" />
        </div>
      </div>

      {/* Jobs */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Analysis Jobs</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <Stat icon={Activity} label="Pending" value={fmt(data.jobs.pending)} tone={data.jobs.pending > 20 ? "warn" : "default"} />
          <Stat icon={AlertTriangle} label="Failed (24h)" value={fmt(data.jobs.failed24h)} tone={jobsTone} />
        </div>
      </div>

      {/* Webhooks */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Payment Webhook Activations</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <Stat icon={Webhook} label="Successful (24h)" value={fmt(data.webhooks.successful24h)} tone="ok" />
          <Stat icon={AlertTriangle} label="Failed (24h)" value={fmt(data.webhooks.failed24h)} tone={webhookTone} />
          <Stat icon={AlertTriangle} label="Failure rate" value={`${data.webhooks.failureRate}%`} tone={webhookTone} hint=">1% needs attention" />
        </div>
      </div>

      {/* Chart */}
      <Card className="p-5">
        <h3 className="mb-4 font-semibold">Analyses — last 24 hours (hourly)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data.hourly}>
            <defs>
              <linearGradient id="hg1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="hour" fontSize={10} />
            <YAxis fontSize={10} allowDecimals={false} />
            <Tooltip />
            <Area type="monotone" dataKey="analyses" stroke="hsl(var(--primary))" fill="url(#hg1)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Recent failures */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 font-semibold">Recent failed jobs (24h)</h3>
          {data.jobs.recentFailures.length === 0 ? (
            <p className="text-sm text-muted-foreground">No failures. ✅</p>
          ) : (
            <div className="space-y-2">
              {data.jobs.recentFailures.map((j) => (
                <div key={j.id} className="rounded-md border bg-muted/30 p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-muted-foreground">{new Date(j.created_at).toLocaleString()}</span>
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-destructive">attempts: {j.attempts}</span>
                  </div>
                  <div className="mt-1 break-words text-foreground">{j.error || "(no error message)"}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 font-semibold">Recent webhook failures (24h)</h3>
          {data.webhooks.recentFailures.length === 0 ? (
            <p className="text-sm text-muted-foreground">No failures. ✅</p>
          ) : (
            <div className="space-y-2">
              {data.webhooks.recentFailures.map((e) => (
                <div key={e.id} className="rounded-md border bg-muted/30 p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-700">{e.event}</span>
                  </div>
                  <div className="mt-1 text-foreground">{e.user_email || e.tx_ref || "—"}</div>
                  {e.error_message && (
                    <div className="mt-1 break-words text-destructive">{e.error_message}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
