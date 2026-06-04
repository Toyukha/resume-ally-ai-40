import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { getPlatformStats } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/revenue")({
  head: () => ({ meta: [{ title: "Revenue — Admin" }] }),
  component: RevenuePage,
});

function RevenuePage() {
  const fn = useServerFn(getPlatformStats);
  const { data } = useQuery({ queryKey: ["admin-stats"], queryFn: () => fn() });
  if (!data) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const PRO = 5000;
  const monthly = data.monthlyRevenue;
  const daily = Math.round(monthly / 30);
  const weekly = daily * 7;
  const annual = monthly * 12;
  const trend = data.trend.map((d) => ({ day: d.day, est: 0 })); // no per-day revenue events yet

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">Revenue Dashboard</h1>
        <p className="text-sm text-muted-foreground">Active subscribers × ₦{PRO.toLocaleString()} / month.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-5"><div className="text-xs uppercase text-muted-foreground">Daily (est)</div><div className="mt-1 font-display text-2xl font-bold">₦{daily.toLocaleString()}</div></Card>
        <Card className="p-5"><div className="text-xs uppercase text-muted-foreground">Weekly (est)</div><div className="mt-1 font-display text-2xl font-bold">₦{weekly.toLocaleString()}</div></Card>
        <Card className="p-5"><div className="text-xs uppercase text-muted-foreground">Monthly</div><div className="mt-1 font-display text-2xl font-bold">₦{monthly.toLocaleString()}</div></Card>
        <Card className="p-5"><div className="text-xs uppercase text-muted-foreground">Annual (run rate)</div><div className="mt-1 font-display text-2xl font-bold">₦{annual.toLocaleString()}</div></Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5"><div className="text-xs uppercase text-muted-foreground">Active Subscribers</div><div className="mt-1 font-display text-2xl font-bold">{data.activeSubscribers}</div></Card>
        <Card className="p-5"><div className="text-xs uppercase text-muted-foreground">Conversion Rate</div><div className="mt-1 font-display text-2xl font-bold">{data.conversionRate}%</div></Card>
        <Card className="p-5"><div className="text-xs uppercase text-muted-foreground">ARPU</div><div className="mt-1 font-display text-2xl font-bold">₦{data.totalUsers ? Math.round(monthly / data.totalUsers).toLocaleString() : 0}</div></Card>
      </div>

      <Card className="p-5">
        <h3 className="mb-4 font-semibold">Activity volume (30 days)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data.trend}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="day" tickFormatter={(d) => d.slice(5)} fontSize={10} />
            <YAxis fontSize={10} allowDecimals={false} />
            <Tooltip />
            <Area dataKey="analyses" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
