import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Users, FileBarChart2, TrendingUp, CreditCard, UserPlus, Activity, DollarSign, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminBootstrap } from "@/lib/admin.functions";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Bar, BarChart } from "recharts";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Overview" }] }),
  component: AdminOverview,
});

function Stat({ icon: Icon, label, value, hint }: { icon: typeof Users; label: string; value: string | number; hint?: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Platform Overview</h1>
        <p className="text-sm text-muted-foreground">Loading realtime snapshot…</p>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Card key={i} className="p-5"><Skeleton className="h-4 w-24" /><Skeleton className="mt-3 h-7 w-20" /></Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5"><Skeleton className="h-5 w-40" /><Skeleton className="mt-4 h-[240px] w-full" /></Card>
        <Card className="p-5"><Skeleton className="h-5 w-40" /><Skeleton className="mt-4 h-[240px] w-full" /></Card>
      </div>
    </div>
  );
}

function AdminOverview() {
  const fn = useServerFn(getAdminBootstrap);
  const { data: bootstrap, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-bootstrap"],
    queryFn: () => fn(),
    staleTime: 30_000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <OverviewSkeleton />;

  const data = bootstrap?.stats;
  if (isError || !data) {
    const msg = bootstrap?.statsError ?? (error instanceof Error ? error.message : null);
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-bold">Platform Overview</h1>
        <Card className="p-6">
          <p className="text-sm text-destructive">Couldn't load platform statistics.</p>
          {msg && <p className="mt-1 text-xs text-muted-foreground">{msg}</p>}
          <Button onClick={() => refetch()} disabled={isFetching} size="sm" className="mt-4">
            {isFetching ? "Retrying…" : "Retry"}
          </Button>
        </Card>
      </div>
    );
  }

  const fmt = (n: number) => new Intl.NumberFormat().format(n);
  const naira = (n: number) => `₦${fmt(n)}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Platform Overview</h1>
        <p className="text-sm text-muted-foreground">Realtime snapshot of users, analyses, and revenue.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat icon={Users} label="Total Users" value={fmt(data.totalUsers)} />
        <Stat icon={Activity} label="Active Pro" value={fmt(data.activeUsers)} hint="Within their 30-day window" />
        <Stat icon={UserPlus} label="New Today" value={fmt(data.newUsersToday)} />
        <Stat icon={UserPlus} label="New This Month" value={fmt(data.newUsersThisMonth)} />
        <Stat icon={FileBarChart2} label="Total Analyses" value={fmt(data.totalAnalyses)} />
        <Stat icon={FileBarChart2} label="Analyses Today" value={fmt(data.analysesToday)} />
        <Stat icon={FileBarChart2} label="Analyses This Month" value={fmt(data.analysesThisMonth)} />
        <Stat icon={TrendingUp} label="Conversion" value={`${data.conversionRate}%`} hint="Pro / Total users" />
        <Stat icon={DollarSign} label="Monthly Revenue" value={naira(data.monthlyRevenue)} />
        <Stat icon={DollarSign} label="Total Revenue" value={naira(data.totalRevenue)} hint="All successful payments" />
        <Stat icon={CreditCard} label="Active Subscribers" value={fmt(data.activeSubscribers)} />
        <Stat icon={BarChart3} label="Avg/Day (30d)" value={fmt(Math.round(data.trend.reduce((s: number, d: { analyses: number }) => s + d.analyses, 0) / 30))} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 font-semibold">Analyses — last 30 days</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data.trend}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="day" tickFormatter={(d) => d.slice(5)} fontSize={10} />
              <YAxis fontSize={10} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="analyses" stroke="hsl(var(--primary))" fill="url(#g1)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <h3 className="mb-4 font-semibold">New signups — last 30 days</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.trend}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="day" tickFormatter={(d) => d.slice(5)} fontSize={10} />
              <YAxis fontSize={10} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="signups" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
