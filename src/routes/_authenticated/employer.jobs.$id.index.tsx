import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getJobForEdit } from "@/lib/employer/employer-jobs.functions";
import { listJobApplications } from "@/lib/employer/applications.functions";
import { MatchScoreRing } from "@/components/jobs/match-score-ring";

export const Route = createFileRoute("/_authenticated/employer/jobs/$id/")({
  head: () => ({ meta: [{ title: "Job — Employer" }] }),
  component: JobDetail,
});

function JobDetail() {
  const { id } = useParams({ from: "/_authenticated/employer/jobs/$id/" });
  const getFn = useServerFn(getJobForEdit);
  const appsFn = useServerFn(listJobApplications);
  const { data: job } = useQuery({ queryKey: ["employer-job", id], queryFn: () => getFn({ data: { id } }) });
  const { data: apps = [] } = useQuery({ queryKey: ["employer-job-apps", id], queryFn: () => appsFn({ data: { jobId: id } }) });

  if (!job) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-5">
      <Link to="/employer/jobs" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3 w-3" /> All jobs</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">{job.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="capitalize">{job.status}</Badge>
            <Badge variant="secondary" className="capitalize">{job.work_mode}</Badge>
            <Badge variant="secondary" className="capitalize">{job.employment_type.replace("_", "-")}</Badge>
            {job.location && <span>· {job.location}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to="/employer/jobs/$id/edit" params={{ id }}>Edit</Link></Button>
          <Button asChild variant="hero"><Link to="/employer/pipeline/$jobId" params={{ jobId: id }}>Open pipeline</Link></Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="bg-card-gradient p-5 lg:col-span-2">
          <h2 className="mb-2 font-display font-semibold">Description</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{job.description}</p>
          {job.responsibilities && (
            <>
              <h3 className="mt-4 mb-1 text-sm font-semibold">Responsibilities</h3>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{job.responsibilities}</p>
            </>
          )}
          {(job.required_skills?.length ?? 0) > 0 && (
            <>
              <h3 className="mt-4 mb-1 text-sm font-semibold">Required skills</h3>
              <div className="flex flex-wrap gap-1.5">{job.required_skills.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}</div>
            </>
          )}
        </Card>

        <Card className="bg-card-gradient p-5">
          <h2 className="mb-3 font-display font-semibold">Applicants ({apps.length})</h2>
          {apps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No applications yet.</p>
          ) : (
            <ul className="space-y-2">
              {apps.slice(0, 8).map((a: any) => (
                <li key={a.id} className="flex items-center gap-3 rounded-lg border border-border/60 p-2.5">
                  <MatchScoreRing score={a.candidate_scores?.[0]?.ats_score ?? 0} size={42} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{a.candidate_name ?? a.candidate_email ?? "Candidate"}</div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{a.stage.replace(/_/g, " ")}</div>
                  </div>
                  <Button size="sm" variant="ghost" asChild>
                    <Link to="/employer/candidates/$id" params={{ id: a.id }}><ExternalLink className="h-3.5 w-3.5" /></Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
