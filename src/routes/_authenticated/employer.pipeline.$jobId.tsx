import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listJobApplications, updateApplicationStage } from "@/lib/employer/applications.functions";
import { getJobForEdit } from "@/lib/employer/employer-jobs.functions";
import { MatchScoreRing } from "@/components/jobs/match-score-ring";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/employer/pipeline/$jobId")({
  head: () => ({ meta: [{ title: "Pipeline — Employer" }] }),
  component: Pipeline,
});

const STAGES = [
  { id: "applied", label: "Applied" },
  { id: "under_review", label: "Under Review" },
  { id: "shortlisted", label: "Shortlisted" },
  { id: "interview_scheduled", label: "Interview" },
  { id: "assessment", label: "Assessment" },
  { id: "final_review", label: "Final Review" },
  { id: "offer_sent", label: "Offer Sent" },
  { id: "hired", label: "Hired" },
  { id: "rejected", label: "Rejected" },
] as const;
type Stage = typeof STAGES[number]["id"];

function Pipeline() {
  const { jobId } = useParams({ from: "/_authenticated/employer/pipeline/$jobId" });
  const qc = useQueryClient();
  const listFn = useServerFn(listJobApplications);
  const jobFn = useServerFn(getJobForEdit);
  const moveFn = useServerFn(updateApplicationStage);

  const { data: apps = [] } = useQuery({ queryKey: ["employer-job-apps", jobId], queryFn: () => listFn({ data: { jobId } }) });
  const { data: job } = useQuery({ queryKey: ["employer-job", jobId], queryFn: () => jobFn({ data: { id: jobId } }) });

  const move = useMutation({
    mutationFn: (v: { id: string; stage: Stage; reason?: string }) => moveFn({ data: { id: v.id, stage: v.stage, rejectedReason: v.reason } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employer-job-apps", jobId] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const byStage: Record<Stage, any[]> = Object.fromEntries(STAGES.map((s) => [s.id, [] as any[]])) as any;
  for (const a of apps as any[]) byStage[a.stage as Stage]?.push(a);

  const handleAdvance = (a: any, next: Stage) => {
    if (next === "rejected") {
      const reason = prompt("Reason for rejection?") ?? undefined;
      move.mutate({ id: a.id, stage: next, reason });
    } else {
      move.mutate({ id: a.id, stage: next });
    }
  };

  return (
    <div className="space-y-4">
      <Link to="/employer/jobs/$id" params={{ id: jobId }} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Back to job
      </Link>
      <div>
        <h1 className="font-display text-2xl font-bold">{job?.title ?? "Pipeline"}</h1>
        <p className="text-sm text-muted-foreground">{apps.length} candidate{apps.length === 1 ? "" : "s"}</p>
      </div>
      <div className="-mx-2 overflow-x-auto pb-3">
        <div className="flex min-w-max gap-3 px-2">
          {STAGES.map((s, idx) => (
            <div key={s.id} className="w-72 shrink-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</h3>
                <Badge variant="secondary" className="text-[10px]">{byStage[s.id].length}</Badge>
              </div>
              <div className="space-y-2 rounded-xl border border-border bg-card/30 p-2 min-h-[120px]">
                {byStage[s.id].map((a) => {
                  const score = a.candidate_scores?.[0]?.ats_score ?? 0;
                  const nextStage = STAGES[idx + 1]?.id;
                  return (
                    <Card key={a.id} className="bg-card-gradient p-3">
                      <div className="flex items-start gap-2">
                        <MatchScoreRing score={score} size={40} />
                        <div className="min-w-0 flex-1">
                          <Link to="/employer/candidates/$id" params={{ id: a.id }} className="block truncate text-sm font-semibold hover:text-primary-glow">
                            {a.candidate_name ?? a.candidate_email ?? "Candidate"}
                          </Link>
                          {a.candidate_scores?.[0]?.summary && (
                            <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{a.candidate_scores[0].summary}</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 flex gap-1">
                        {nextStage && s.id !== "hired" && s.id !== "rejected" && (
                          <Button size="sm" variant="outline" className="h-7 flex-1 text-[10px]" onClick={() => handleAdvance(a, nextStage)}>
                            <ChevronRight className="mr-0.5 h-3 w-3" /> Advance
                          </Button>
                        )}
                        {s.id !== "rejected" && (
                          <Button size="sm" variant="ghost" className="h-7 text-[10px] text-destructive" onClick={() => handleAdvance(a, "rejected")}>
                            Reject
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
