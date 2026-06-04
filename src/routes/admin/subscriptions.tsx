import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listAllUsers } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/subscriptions")({
  head: () => ({ meta: [{ title: "Subscriptions — Admin" }] }),
  component: SubsPage,
});

function SubsPage() {
  const fn = useServerFn(listAllUsers);
  const { data } = useQuery({ queryKey: ["admin-subs"], queryFn: () => fn({ data: {} }) });

  const users = data ?? [];
  const now = Date.now();
  const free = users.filter((u) => u.plan !== "pro");
  const proActive = users.filter((u) => u.plan === "pro" && u.pro_expires_at && new Date(u.pro_expires_at).getTime() > now);
  const proExpired = users.filter((u) => u.plan === "pro" && (!u.pro_expires_at || new Date(u.pro_expires_at).getTime() <= now));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">Subscription Management</h1>
        <p className="text-sm text-muted-foreground">Active subscribers, expired Pro accounts, and free users.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5"><div className="text-xs uppercase text-muted-foreground">Free</div><div className="mt-1 font-display text-3xl font-bold">{free.length}</div></Card>
        <Card className="p-5"><div className="text-xs uppercase text-muted-foreground">Pro — Active</div><div className="mt-1 font-display text-3xl font-bold text-primary">{proActive.length}</div></Card>
        <Card className="p-5"><div className="text-xs uppercase text-muted-foreground">Pro — Expired</div><div className="mt-1 font-display text-3xl font-bold text-destructive">{proExpired.length}</div></Card>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="p-3">Email</th><th className="p-3">Plan</th><th className="p-3">Expires</th><th className="p-3">Status</th></tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const expires = u.pro_expires_at ? new Date(u.pro_expires_at) : null;
                const active = u.plan === "pro" && expires && expires.getTime() > now;
                return (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{u.email}</td>
                    <td className="p-3"><Badge variant={u.plan === "pro" ? "default" : "secondary"}>{u.plan}</Badge></td>
                    <td className="p-3 text-muted-foreground">{expires ? expires.toLocaleDateString() : "—"}</td>
                    <td className="p-3">{u.plan === "pro" ? (active ? <Badge>Active</Badge> : <Badge variant="destructive">Expired</Badge>) : <span className="text-muted-foreground">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-xs text-muted-foreground">Tip: change a user's plan from the Users page (super admins only).</p>
    </div>
  );
}
