import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEmployerCtx } from "./employer";
import { listCompanyInterviews } from "@/lib/employer/interviews.functions";

export const Route = createFileRoute("/_authenticated/employer/interviews")({
  head: () => ({ meta: [{ title: "Interviews — Employer" }] }),
  component: InterviewsPage,
});

function InterviewsPage() {
  const { activeCompanyId } = useEmployerCtx();
  const fn = useServerFn(listCompanyInterviews);
  const { data = [] } = useQuery({ queryKey: ["company-interviews", activeCompanyId], queryFn: () => fn({ data: { companyId: activeCompanyId } }) });
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Interviews</h1>
      {data.length === 0 ? (
        <Card className="bg-card-gradient p-10 text-center text-sm text-muted-foreground">No interviews scheduled yet.</Card>
      ) : (
        <ul className="space-y-2">
          {data.map((iv: any) => (
            <Card key={iv.id} className="flex flex-wrap items-center justify-between gap-3 bg-card-gradient p-4">
              <div>
                <div className="font-semibold">{iv.application?.candidate_name ?? "Candidate"} · <span className="text-muted-foreground">{iv.application?.employer_jobs?.title}</span></div>
                <div className="text-xs text-muted-foreground">{new Date(iv.scheduled_for).toLocaleString()} · {iv.mode} · {iv.duration_minutes} min</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">{iv.status}</Badge>
                <Link to="/employer/candidates/$id" params={{ id: iv.application?.id }} className="text-xs text-primary-glow hover:underline">Open</Link>
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
