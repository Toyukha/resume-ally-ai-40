import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listActivityLogs } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/logs")({
  head: () => ({ meta: [{ title: "Activity Logs — Admin" }] }),
  component: LogsPage,
});

function LogsPage() {
  const fn = useServerFn(listActivityLogs);
  const { data } = useQuery({ queryKey: ["admin-logs"], queryFn: () => fn() });
  const rows = data ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">Activity Logs</h1>
        <p className="text-sm text-muted-foreground">Audit trail of admin actions across the platform.</p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">When</th>
                <th className="p-3">Actor</th>
                <th className="p-3">Action</th>
                <th className="p-3">Target</th>
                <th className="p-3">Metadata</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0 align-top">
                  <td className="p-3 text-muted-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-3">{r.actor_email ?? r.actor_id?.slice(0, 8) ?? "system"}</td>
                  <td className="p-3"><Badge variant="outline">{r.action}</Badge></td>
                  <td className="p-3 font-mono text-xs">{r.target_type ? `${r.target_type}:${(r.target_id ?? "").slice(0, 8)}` : "—"}</td>
                  <td className="p-3 text-xs text-muted-foreground"><code>{JSON.stringify(r.metadata)}</code></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">No activity logged yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
