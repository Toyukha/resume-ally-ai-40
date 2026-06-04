import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { listAllAnalyses } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/analyses")({
  head: () => ({ meta: [{ title: "Analyses — Admin" }] }),
  component: AnalysesPage,
});

function AnalysesPage() {
  const fn = useServerFn(listAllAnalyses);
  const { data } = useQuery({ queryKey: ["admin-analyses"], queryFn: () => fn() });
  const rows = data ?? [];

  const avgScore = rows.length ? Math.round(rows.reduce((s, r) => s + r.match_score, 0) / rows.length) : 0;

  const exportCsv = () => {
    const header = "id,user_id,resume_filename,match_score,created_at\n";
    const body = rows.map((r) => [r.id, r.user_id, JSON.stringify(r.resume_filename ?? ""), r.match_score, r.created_at].join(",")).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `analyses-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Analysis Monitoring</h1>
          <p className="text-sm text-muted-foreground">All CV analyses with match scores and trends.</p>
        </div>
        <Button onClick={exportCsv} variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Export CSV</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5"><div className="text-xs uppercase text-muted-foreground">Total Analyses</div><div className="mt-1 font-display text-3xl font-bold">{rows.length}</div></Card>
        <Card className="p-5"><div className="text-xs uppercase text-muted-foreground">Average Match Score</div><div className="mt-1 font-display text-3xl font-bold">{avgScore}</div></Card>
        <Card className="p-5"><div className="text-xs uppercase text-muted-foreground">Unique Users</div><div className="mt-1 font-display text-3xl font-bold">{new Set(rows.map((r) => r.user_id)).size}</div></Card>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="p-3">When</th><th className="p-3">User ID</th><th className="p-3">File</th><th className="p-3">Score</th><th className="p-3">Summary</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="p-3 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-3 font-mono text-xs">{r.user_id.slice(0, 8)}…</td>
                  <td className="p-3">{r.resume_filename ?? "—"}</td>
                  <td className="p-3 font-bold">{r.match_score}</td>
                  <td className="p-3 max-w-[400px] truncate text-muted-foreground">{r.summary}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">No analyses yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
