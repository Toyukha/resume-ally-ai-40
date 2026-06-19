import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bookmark, Loader2, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { JobCard } from "@/components/jobs/job-card";
import { listSavedJobs, type NormalizedJob } from "@/lib/jobs.functions";

export const Route = createFileRoute("/_authenticated/jobs/saved")({
  component: SavedJobs,
});

function SavedJobs() {
  const fn = useServerFn(listSavedJobs);
  const q = useQuery({ queryKey: ["saved-jobs"], queryFn: () => fn() });

  if (q.isLoading) return <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const rows = q.data ?? [];
  if (rows.length === 0) {
    return (
      <Card className="grid place-items-center gap-2 p-12 text-center">
        <Bookmark className="h-8 w-8 text-muted-foreground" />
        <div className="font-semibold">No saved jobs yet</div>
        <p className="text-sm text-muted-foreground">Save jobs from Browse to access them here.</p>
      </Card>
    );
  }

  const favorites = rows.filter((r) => r.favorited);
  const others = rows.filter((r) => !r.favorited);

  const toJob = (r: typeof rows[number]): NormalizedJob => ({
    id: r.external_id,
    slug: r.external_id,
    title: r.title,
    company: r.company ?? "",
    location: r.location ?? "",
    remote: r.remote,
    employmentType: r.employment_type ?? "",
    postedAt: r.posted_at ?? r.created_at,
    url: r.url ?? "",
    description: r.description ?? "",
    tags: r.tags ?? [],
    provider: "arbeitnow",
  });

  return (
    <div className="space-y-6">
      {favorites.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold"><Star className="h-4 w-4 fill-gold text-gold" /> Favorites</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {favorites.map((r) => <JobCard key={r.id} job={toJob(r)} savedId={r.id} favorited />)}
          </div>
        </section>
      )}
      <section>
        <h2 className="mb-3 font-display text-lg font-semibold">All saved</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {others.map((r) => <JobCard key={r.id} job={toJob(r)} savedId={r.id} favorited={false} />)}
        </div>
      </section>
    </div>
  );
}
