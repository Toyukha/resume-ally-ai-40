import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Briefcase } from "lucide-react";
import { Card } from "@/components/ui/card";
import { JobFilters } from "@/components/jobs/job-filters";
import { JobCard } from "@/components/jobs/job-card";
import { searchJobs, listSavedJobs, type JobSearchInput } from "@/lib/jobs.functions";

export const Route = createFileRoute("/_authenticated/jobs/")({
  component: BrowseJobs,
});

function BrowseJobs() {
  const [filters, setFilters] = useState<JobSearchInput>({ remote: "any" });
  const searchFn = useServerFn(searchJobs);
  const savedFn = useServerFn(listSavedJobs);

  const jobsQ = useQuery({
    queryKey: ["jobs-search", filters],
    queryFn: () => searchFn({ data: filters }),
    staleTime: 60_000,
  });
  const savedQ = useQuery({ queryKey: ["saved-jobs"], queryFn: () => savedFn() });

  const savedMap = new Map<string, { id: string; favorited: boolean }>();
  for (const s of savedQ.data ?? []) savedMap.set(`${s.provider}:${s.external_id}`, { id: s.id, favorited: s.favorited });

  return (
    <div className="space-y-5">
      <JobFilters value={filters} onChange={setFilters} />

      {jobsQ.isLoading ? (
        <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : jobsQ.isError ? (
        <Card className="p-6 text-sm text-destructive">Couldn't load jobs. {String((jobsQ.error as Error).message)}</Card>
      ) : (jobsQ.data?.jobs.length ?? 0) === 0 ? (
        <Card className="grid place-items-center gap-2 p-12 text-center">
          <Briefcase className="h-8 w-8 text-muted-foreground" />
          <div className="font-semibold">No jobs match your filters</div>
          <p className="text-sm text-muted-foreground">Try a broader search or clear filters.</p>
        </Card>
      ) : (
        <>
          <div className="text-xs text-muted-foreground">{jobsQ.data!.total} results</div>
          <div className="grid gap-4 md:grid-cols-2">
            {jobsQ.data!.jobs.map((j) => {
              const s = savedMap.get(`${j.provider}:${j.slug}`);
              return <JobCard key={j.slug} job={j} savedId={s?.id} favorited={s?.favorited} />;
            })}
          </div>
        </>
      )}
    </div>
  );
}
