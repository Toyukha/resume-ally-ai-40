import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, MoreHorizontal, Eye, Pencil, Copy, Archive, Play, Pause, Trash2 } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEmployerCtx } from "./employer";
import { listCompanyJobs, setJobStatus, duplicateJob, deleteJob } from "@/lib/employer/employer-jobs.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/employer/jobs/")({
  head: () => ({ meta: [{ title: "Jobs — Employer" }] }),
  component: JobsList,
});

const STATUSES = ["all", "draft", "active", "closed", "archived"] as const;

function JobsList() {
  const { activeCompanyId } = useEmployerCtx();
  const [filter, setFilter] = useState<typeof STATUSES[number]>("all");
  const qc = useQueryClient();
  const listFn = useServerFn(listCompanyJobs);
  const statusFn = useServerFn(setJobStatus);
  const dupFn = useServerFn(duplicateJob);
  const delFn = useServerFn(deleteJob);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["employer-jobs", activeCompanyId, filter],
    queryFn: () => listFn({ data: { companyId: activeCompanyId, status: filter } }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["employer-jobs", activeCompanyId] });
  const setStatusM = useMutation({
    mutationFn: (v: { id: string; status: "draft" | "active" | "closed" | "archived" }) => statusFn({ data: v }),
    onSuccess: () => { toast.success("Updated"); invalidate(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const dupM = useMutation({
    mutationFn: (id: string) => dupFn({ data: { id } }),
    onSuccess: () => { toast.success("Duplicated"); invalidate(); },
  });
  const delM = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); invalidate(); },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Jobs</h1>
          <p className="text-sm text-muted-foreground">Manage roles your team is hiring for.</p>
        </div>
        <Button asChild variant="hero"><Link to="/employer/jobs/new"><Plus className="mr-1.5 h-4 w-4" /> Post a job</Link></Button>
      </div>

      <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-card/40 p-1">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${filter === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
      ) : jobs.length === 0 ? (
        <Card className="bg-card-gradient p-10 text-center">
          <p className="text-sm text-muted-foreground">No jobs yet. Post your first role to start receiving applications.</p>
          <Button asChild variant="hero" className="mt-4"><Link to="/employer/jobs/new">Post a job</Link></Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {jobs.map((j) => (
            <Card key={j.id} className="flex flex-wrap items-center gap-3 bg-card-gradient p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to="/employer/jobs/$id" params={{ id: j.id }} className="truncate font-display font-semibold hover:text-primary-glow">{j.title}</Link>
                  <Badge variant="outline" className="capitalize">{j.status}</Badge>
                  {j.work_mode && <Badge variant="secondary" className="text-[10px] capitalize">{j.work_mode}</Badge>}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {j.location || "—"} · {j.application_count} applicant{j.application_count === 1 ? "" : "s"} · created {new Date(j.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <Button size="sm" variant="outline" asChild>
                  <Link to="/employer/pipeline/$jobId" params={{ jobId: j.id }}><Eye className="mr-1 h-3.5 w-3.5" /> Pipeline</Link>
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <Link to="/employer/jobs/$id/edit" params={{ id: j.id }}><Pencil className="h-3.5 w-3.5" /></Link>
                </Button>
                {j.status === "draft" && (
                  <Button size="sm" variant="ghost" onClick={() => setStatusM.mutate({ id: j.id, status: "active" })}><Play className="h-3.5 w-3.5" /></Button>
                )}
                {j.status === "active" && (
                  <Button size="sm" variant="ghost" onClick={() => setStatusM.mutate({ id: j.id, status: "closed" })}><Pause className="h-3.5 w-3.5" /></Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => dupM.mutate(j.id)}><Copy className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => setStatusM.mutate({ id: j.id, status: "archived" })}><Archive className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete this job and all its applications?")) delM.mutate(j.id); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
