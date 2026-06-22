import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Loader2, Briefcase, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JobFiltersSidebar, JobFiltersMobile } from "@/components/jobs/job-filters";
import { QuickFilterCards } from "@/components/jobs/quick-filter-cards";
import { ActiveFilterChips } from "@/components/jobs/active-filter-chips";
import { JobStatsStrip } from "@/components/jobs/job-stats-strip";
import { JobCard } from "@/components/jobs/job-card";
import { searchJobs, listSavedJobs, ADZUNA_COUNTRIES, type JobSearchInput } from "@/lib/jobs.functions";

const searchSchema = z.object({
  query: fallback(z.string().optional(), undefined),
  location: fallback(z.string().optional(), undefined),
  country: fallback(z.enum(ADZUNA_COUNTRIES).optional(), undefined),
  workTypes: fallback(z.array(z.enum(["remote", "hybrid", "onsite"])).optional(), undefined),
  employmentTypes: fallback(z.array(z.string()).optional(), undefined),
  categories: fallback(z.array(z.string()).optional(), undefined),
  experienceLevels: fallback(z.array(z.string()).optional(), undefined),
  postedWithinDays: fallback(z.number().int().min(0).max(180).optional(), undefined),
  sort: fallback(
    z.enum(["relevance", "newest", "match", "remote-first", "company-az"]).optional(),
    undefined,
  ),
  page: fallback(z.number().int().min(1).max(10), 1).default(1),
});

export const Route = createFileRoute("/_authenticated/jobs/")({
  validateSearch: zodValidator(searchSchema),
  component: BrowseJobs,
});

function BrowseJobs() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/jobs" });
  const topRef = useRef<HTMLDivElement>(null);
  const searchFn = useServerFn(searchJobs);
  const savedFn = useServerFn(listSavedJobs);

  const filters: JobSearchInput = {
    query: search.query,
    location: search.location,
    country: search.country ?? "gb",
    workTypes: search.workTypes,
    employmentTypes: search.employmentTypes,
    categories: search.categories,
    experienceLevels: search.experienceLevels,
    postedWithinDays: search.postedWithinDays,
    sort: search.sort,
  };

  const updateFilters = (next: JobSearchInput) => {
    navigate({
      search: () => ({
        query: next.query || undefined,
        location: next.location || undefined,
        country: next.country,
        workTypes: next.workTypes,
        employmentTypes: next.employmentTypes,
        categories: next.categories,
        experienceLevels: next.experienceLevels,
        postedWithinDays: next.postedWithinDays,
        sort: next.sort,
        page: 1,
      }),
      replace: true,
    });
  };

  const applyPreset = (patch: Partial<JobSearchInput>) => updateFilters({ ...filters, ...patch });
  const clearAll = () =>
    navigate({ search: () => ({ page: 1, country: "gb" as const }), replace: true });

  const queryInput = { ...filters, page: search.page };
  const jobsQ = useQuery({
    queryKey: ["jobs-search", queryInput],
    queryFn: () => searchFn({ data: queryInput }),
    staleTime: 60_000,
  });
  const savedQ = useQuery({ queryKey: ["saved-jobs"], queryFn: () => savedFn() });

  // Scroll to top on page change
  const page = search.page;
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [page]);

  const goToPage = (next: number) =>
    navigate({ search: (prev) => ({ ...prev, page: next }), replace: true });

  const savedMap = new Map<string, { id: string; favorited: boolean }>();
  for (const s of savedQ.data ?? []) savedMap.set(`${s.provider}:${s.external_id}`, { id: s.id, favorited: s.favorited });

  const hasMore = jobsQ.data?.hasMore ?? false;
  const maxPage = 10;

  return (
    <div ref={topRef} className="grid gap-6 lg:grid-cols-[280px_1fr]">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:block">
        <div className="sticky top-4 rounded-2xl border border-border bg-card/40 p-4">
          <JobFiltersSidebar value={filters} onChange={updateFilters} onClear={clearAll} />
        </div>
      </aside>

      {/* Results */}
      <div className="space-y-4">
        <JobStatsStrip />
        <QuickFilterCards current={filters} onApply={applyPreset} />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <ActiveFilterChips value={filters} onChange={updateFilters} />
          <JobFiltersMobile value={filters} onChange={updateFilters} onClear={clearAll} />
        </div>

        {jobsQ.isLoading ? (
          <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : jobsQ.isError ? (
          <Card className="p-6 text-sm text-destructive">Couldn't load jobs. {String((jobsQ.error as Error).message)}</Card>
        ) : (jobsQ.data?.jobs.length ?? 0) === 0 ? (
          <Card className="grid place-items-center gap-2 p-12 text-center">
            <Briefcase className="h-8 w-8 text-muted-foreground" />
            <div className="font-semibold">No jobs match your filters</div>
            <p className="text-sm text-muted-foreground">Try a broader search or clear filters.</p>
            <Button variant="outline" size="sm" onClick={clearAll}>Clear all filters</Button>
          </Card>
        ) : (
          <>
            <div className="text-xs text-muted-foreground">
              {jobsQ.data!.total.toLocaleString()} results · Page {page}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {jobsQ.data!.jobs.map((j) => {
                const s = savedMap.get(`${j.provider}:${j.slug}`);
                return <JobCard key={j.slug} job={j} savedId={s?.id} favorited={s?.favorited} />;
              })}
            </div>
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button variant="outline" size="sm" onClick={() => goToPage(page - 1)} disabled={page <= 1 || jobsQ.isFetching}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page}</span>
              <Button variant="outline" size="sm" onClick={() => goToPage(page + 1)} disabled={!hasMore || page >= maxPage || jobsQ.isFetching}>
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
