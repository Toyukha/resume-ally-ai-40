import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Briefcase, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JobFilters } from "@/components/jobs/job-filters";
import { JobCard } from "@/components/jobs/job-card";
import { searchJobs, listSavedJobs, type JobSearchInput } from "@/lib/jobs.functions";

export const Route = createFileRoute("/_authenticated/jobs/")({
  component: BrowseJobs,
});

function BrowseJobs() {
  const [filters, setFilters] = useState<JobSearchInput>({ remote: "any", country: "gb" });
  const [page, setPage] = useState(1);
  const topRef = useRef<HTMLDivElement>(null);
  const searchFn = useServerFn(searchJobs);
  const savedFn = useServerFn(listSavedJobs);

  // Reset to page 1 whenever filters change
  const filtersKey = JSON.stringify(filters);
  useEffect(() => { setPage(1); }, [filtersKey]);

  const queryInput = { ...filters, page };
  const jobsQ = useQuery({
    queryKey: ["jobs-search", queryInput],
    queryFn: () => searchFn({ data: queryInput }),
    staleTime: 60_000,
  });
  const savedQ = useQuery({ queryKey: ["saved-jobs"], queryFn: () => savedFn() });

  const savedMap = new Map<string, { id: string; favorited: boolean }>();
  for (const s of savedQ.data ?? []) savedMap.set(`${s.provider}:${s.external_id}`, { id: s.id, favorited: s.favorited });

  const goToPage = (next: number) => {
    setPage(next);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const hasMore = jobsQ.data?.hasMore ?? false;
  const maxPage = 10;

  return (
    <div className="space-y-5" ref={topRef}>
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
          <div className="text-xs text-muted-foreground">
            {jobsQ.data!.total} results · Page {page}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {jobsQ.data!.jobs.map((j) => {
              const s = savedMap.get(`${j.provider}:${j.slug}`);
              return <JobCard key={j.slug} job={j} savedId={s?.id} favorited={s?.favorited} />;
            })}
          </div>
          <div className="flex items-center justify-center gap-3 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1 || jobsQ.isFetching}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {page}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page + 1)}
              disabled={!hasMore || page >= maxPage || jobsQ.isFetching}
            >
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
