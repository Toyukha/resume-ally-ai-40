import { createFileRoute, notFound, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Loader2, Briefcase, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JobFiltersSidebar, JobFiltersMobile } from "@/components/jobs/job-filters";
import { ActiveFilterChips } from "@/components/jobs/active-filter-chips";
import { JobCard } from "@/components/jobs/job-card";
import { searchJobs, listSavedJobs, type JobSearchInput } from "@/lib/jobs.functions";
import { COUNTRY_BY_SLUG, COUNTRIES, type CountrySlug } from "@/lib/job-countries";

const searchSchema = z.object({
  query: fallback(z.string().optional(), undefined),
  workTypes: fallback(z.array(z.enum(["remote", "hybrid", "onsite"])).optional(), undefined),
  employmentTypes: fallback(z.array(z.string()).optional(), undefined),
  categories: fallback(z.array(z.string()).optional(), undefined),
  experienceLevels: fallback(z.array(z.string()).optional(), undefined),
  postedWithinDays: fallback(z.number().int().optional(), undefined),
  sort: fallback(
    z.enum(["relevance", "newest", "match", "remote-first", "company-az"]).optional(),
    undefined,
  ),
  page: fallback(z.number().int().min(1).max(10), 1).default(1),
});

const VALID_SLUGS = new Set(COUNTRIES.map((c) => c.slug));

export const Route = createFileRoute("/_authenticated/jobs/country/$country")({
  validateSearch: zodValidator(searchSchema),
  beforeLoad: ({ params }) => {
    if (!VALID_SLUGS.has(params.country as CountrySlug)) throw notFound();
  },
  head: ({ params }) => {
    const c = COUNTRY_BY_SLUG[params.country as CountrySlug];
    if (!c) return {};
    const title = c.slug === "remote"
      ? "Remote Jobs Worldwide — Career Boost"
      : `Jobs in ${c.label} — Career Boost`;
    const desc = c.slug === "remote"
      ? "Browse thousands of fresh remote jobs across engineering, design, marketing, sales and more. Get AI-matched to roles that fit your CV."
      : `Find the best ${c.label} jobs across every category. AI-matched, ATS-optimized, and updated daily.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: CountryHub,
});

function CountryHub() {
  const { country: slug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/jobs/country/$country" });
  const topRef = useRef<HTMLDivElement>(null);
  const country = COUNTRY_BY_SLUG[slug as CountrySlug];

  const searchFn = useServerFn(searchJobs);
  const savedFn = useServerFn(listSavedJobs);

  const filters: JobSearchInput = {
    query: search.query,
    location: country.locationKeyword,
    country: country.adzuna,
    countrySlug: country.slug,
    workTypes: country.remoteOnly ? ["remote"] : search.workTypes,
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
  const clearAll = () => navigate({ search: () => ({ page: 1 }), replace: true });

  const queryInput = { ...filters, page: search.page };
  const jobsQ = useQuery({
    queryKey: ["jobs-country", slug, queryInput],
    queryFn: () => searchFn({ data: queryInput }),
    staleTime: 60_000,
  });
  const savedQ = useQuery({ queryKey: ["saved-jobs"], queryFn: () => savedFn() });

  const page = search.page;
  useEffect(() => { topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, [page]);

  const goToPage = (next: number) =>
    navigate({ search: (prev: typeof search) => ({ ...prev, page: next }), replace: true });

  const savedMap = new Map<string, { id: string; favorited: boolean }>();
  for (const s of savedQ.data ?? []) savedMap.set(`${s.provider}:${s.external_id}`, { id: s.id, favorited: s.favorited });

  const hasMore = jobsQ.data?.hasMore ?? false;

  return (
    <div ref={topRef} className="space-y-6">
      {/* Hero */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card/40 to-gold/5 p-6">
        <Link to="/jobs" className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> All jobs
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-5xl">{country.flag}</span>
          <div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">
              {country.slug === "remote" ? "Remote Jobs Worldwide" : `Jobs in ${country.label}`}
            </h2>
            <p className="text-sm text-muted-foreground">
              {jobsQ.data
                ? `${jobsQ.data.total.toLocaleString()} matching roles · refreshed continuously`
                : "Browsing live results…"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-4 rounded-2xl border border-border bg-card/40 p-4">
            <JobFiltersSidebar
              value={filters}
              onChange={updateFilters}
              onClear={clearAll}
              lockedKeys={["country"]}
            />
          </div>
        </aside>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <ActiveFilterChips value={filters} onChange={updateFilters} />
            <JobFiltersMobile value={filters} onChange={updateFilters} onClear={clearAll} lockedKeys={["country"]} />
          </div>

          {jobsQ.isLoading ? (
            <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (jobsQ.data?.jobs.length ?? 0) === 0 ? (
            country.adzuna && !country.remoteOnly && country.locationKeyword ? (
              <Card className="grid place-items-center gap-3 p-12 text-center">
                <Briefcase className="h-8 w-8 text-muted-foreground" />
                <div className="font-semibold">Limited live coverage for {country.label}</div>
                <p className="max-w-md text-sm text-muted-foreground">
                  Our partner job feeds don't index {country.label} directly yet. Browse Remote Worldwide
                  for {country.label}-friendly roles you can do from anywhere.
                </p>
                <Button variant="hero" asChild>
                  <Link to="/jobs/country/$country" params={{ country: "remote" }}>Browse Remote Worldwide</Link>
                </Button>
              </Card>
            ) : (
              <Card className="grid place-items-center gap-2 p-12 text-center">
                <Briefcase className="h-8 w-8 text-muted-foreground" />
                <div className="font-semibold">No jobs match right now</div>
                <p className="text-sm text-muted-foreground">Try broadening filters or check back tomorrow.</p>
              </Card>
            )

          ) : (
            <>
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
                <Button variant="outline" size="sm" onClick={() => goToPage(page + 1)} disabled={!hasMore || page >= 10 || jobsQ.isFetching}>
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Other country shortcuts */}
      <div className="rounded-2xl border border-border bg-card/30 p-5">
        <div className="mb-3 text-sm font-semibold">Explore other countries</div>
        <div className="flex flex-wrap gap-2">
          {COUNTRIES.filter((c) => c.slug !== slug).map((c) => (
            <Link
              key={c.slug}
              to="/jobs/country/$country"
              params={{ country: c.slug }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/50 px-3 py-1.5 text-xs font-medium hover:border-primary-glow/40 hover:text-primary-glow"
            >
              <span>{c.flag}</span> {c.shortLabel}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
