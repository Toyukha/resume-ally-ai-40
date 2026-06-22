import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEmployerCtx } from "./employer";
import { listCompanyJobs } from "@/lib/employer/employer-jobs.functions";

export const Route = createFileRoute("/_authenticated/employer/pipeline/")({
  head: () => ({ meta: [{ title: "Pipeline — Employer" }] }),
  component: PipelineIndex,
});

function PipelineIndex() {
  const { activeCompanyId } = useEmployerCtx();
  const listFn = useServerFn(listCompanyJobs);
  const { data: jobs = [] } = useQuery({
    queryKey: ["employer-jobs", activeCompanyId, "active"],
    queryFn: () => listFn({ data: { companyId: activeCompanyId, status: "active" } }),
  });
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Pipeline</h1>
      <p className="text-sm text-muted-foreground">Select a job to open its candidate kanban.</p>
      {jobs.length === 0 ? (
        <Card className="bg-card-gradient p-8 text-center">
          <p className="text-sm text-muted-foreground">No active jobs yet.</p>
          <Button asChild variant="hero" className="mt-3"><Link to="/employer/jobs/new">Post a job</Link></Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {jobs.map((j) => (
            <Card key={j.id} className="flex items-center justify-between bg-card-gradient p-4">
              <div>
                <div className="font-semibold">{j.title}</div>
                <div className="text-xs text-muted-foreground">{j.application_count} applicant{j.application_count === 1 ? "" : "s"}</div>
              </div>
              <Button asChild variant="outline"><Link to="/employer/pipeline/$jobId" params={{ jobId: j.id }}>Open</Link></Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
