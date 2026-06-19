import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JobCard } from "@/components/jobs/job-card";
import { recommendJobs, listSavedJobs } from "@/lib/jobs.functions";

export const Route = createFileRoute("/_authenticated/jobs/recommendations")({
  component: Recommendations,
});

function Recommendations() {
  const recFn = useServerFn(recommendJobs);
  const savedFn = useServerFn(listSavedJobs);
  const recQ = useQuery({ queryKey: ["recommendations"], queryFn: () => recFn() });
  const savedQ = useQuery({ queryKey: ["saved-jobs"], queryFn: () => savedFn() });

  if (recQ.isLoading) return <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  if (!recQ.data?.hasResume) {
    return (
      <Card className="grid place-items-center gap-3 p-12 text-center">
        <Sparkles className="h-8 w-8 text-gold" />
        <div className="font-display text-lg font-semibold">Run an analysis to unlock recommendations</div>
        <p className="max-w-md text-sm text-muted-foreground">
          We tailor recommendations to your CV. Upload your resume and run an analysis to start.
        </p>
        <Button variant="hero" asChild><Link to="/dashboard">Go to Dashboard</Link></Button>
      </Card>
    );
  }

  const savedMap = new Map<string, { id: string; favorited: boolean }>();
  for (const s of savedQ.data ?? []) savedMap.set(`${s.provider}:${s.external_id}`, { id: s.id, favorited: s.favorited });

  return (
    <div className="space-y-5">
      <Card className="border-gold/30 bg-gold/5 p-4">
        <div className="text-sm font-semibold">Matched on your top skills</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {recQ.data.keywords.map((k) => (
            <Badge key={k} variant="outline" className="border-gold/40 text-gold">{k}</Badge>
          ))}
        </div>
      </Card>

      {recQ.data.jobs.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No fresh matches right now. Check back tomorrow — the feed updates daily.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {recQ.data.jobs.map((j) => {
            const s = savedMap.get(`${j.provider}:${j.slug}`);
            return <JobCard key={j.slug} job={j} savedId={s?.id} favorited={s?.favorited} />;
          })}
        </div>
      )}
    </div>
  );
}
