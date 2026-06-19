import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Briefcase, Bookmark, TrendingUp, Sparkles, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MatchScoreRing } from "@/components/jobs/match-score-ring";
import { getJobsDashboardStats, recommendJobs, APP_STATUSES } from "@/lib/jobs.functions";

export function JobsWidgets() {
  const statsFn = useServerFn(getJobsDashboardStats);
  const recFn = useServerFn(recommendJobs);
  const statsQ = useQuery({ queryKey: ["jobs-dashboard"], queryFn: () => statsFn() });
  const recQ = useQuery({ queryKey: ["jobs-dashboard-rec"], queryFn: () => recFn() });

  const totalApps = Object.values(statsQ.data?.applicationCounts ?? {}).reduce((a, b) => a + b, 0);

  return (
    <section className="mt-10 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">Jobs Marketplace</h2>
        <Button size="sm" variant="outline" asChild>
          <Link to="/jobs"><Briefcase className="mr-1.5 h-3.5 w-3.5" /> Browse jobs</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Saved jobs */}
        <Card className="bg-card-gradient p-4">
          <div className="flex items-center justify-between">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary-glow"><Bookmark className="h-4 w-4" /></div>
            <span className="font-display text-2xl font-bold">{statsQ.data?.savedCount ?? 0}</span>
          </div>
          <div className="mt-2 text-sm font-semibold">Saved jobs</div>
          <Link to="/jobs/saved" className="mt-1 inline-block text-xs text-primary-glow hover:underline">View all →</Link>
        </Card>

        {/* Application progress */}
        <Card className="bg-card-gradient p-4">
          <div className="flex items-center justify-between">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gold/15 text-gold"><TrendingUp className="h-4 w-4" /></div>
            <span className="font-display text-2xl font-bold">{totalApps}</span>
          </div>
          <div className="mt-2 text-sm font-semibold">Applications</div>
          <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-muted/40">
            {APP_STATUSES.map((s) => {
              const n = statsQ.data?.applicationCounts[s] ?? 0;
              const w = totalApps > 0 ? (n / totalApps) * 100 : 0;
              const color =
                s === "offer" ? "bg-success" :
                s === "rejected" ? "bg-destructive" :
                s === "interview" || s === "assessment" ? "bg-gold" :
                s === "applied" ? "bg-primary-glow" : "bg-muted-foreground/30";
              return <div key={s} className={color} style={{ width: `${w}%` }} title={`${s}: ${n}`} />;
            })}
          </div>
          <Link to="/jobs/tracker" className="mt-2 inline-block text-xs text-primary-glow hover:underline">Open tracker →</Link>
        </Card>

        {/* Recent matches */}
        <Card className="bg-card-gradient p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-success/10 text-success"><Sparkles className="h-4 w-4" /></div>
            <span className="text-xs text-muted-foreground">Last 3 matches</span>
          </div>
          <div className="space-y-2">
            {(statsQ.data?.recentMatches ?? []).slice(0, 3).map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <MatchScoreRing score={m.match_score} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold">{m.title}</div>
                  <div className="truncate text-[10px] text-muted-foreground">{m.company}</div>
                </div>
              </div>
            ))}
            {(statsQ.data?.recentMatches?.length ?? 0) === 0 && (
              <div className="text-xs text-muted-foreground">No match analyses yet.</div>
            )}
          </div>
        </Card>

        {/* Recommended */}
        <Card className="bg-card-gradient p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gold/15 text-gold"><Sparkles className="h-4 w-4" /></div>
            <Link to="/jobs/recommendations" className="text-xs text-primary-glow hover:underline">See all →</Link>
          </div>
          <div className="text-sm font-semibold">Recommended for you</div>
          <div className="mt-2 space-y-1.5">
            {(recQ.data?.jobs ?? []).slice(0, 3).map((j) => (
              <a key={j.slug} href={j.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <span className="truncate flex-1">{j.title}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            ))}
            {(recQ.data?.jobs?.length ?? 0) === 0 && (
              <div className="text-xs text-muted-foreground">
                {recQ.data?.hasResume === false ? "Run an analysis to unlock." : "No fresh matches today."}
              </div>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}
