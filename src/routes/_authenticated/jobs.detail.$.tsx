import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  ArrowLeft, Building2, MapPin, Clock, ExternalLink, Sparkles, Bookmark, BookmarkCheck, Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getJob, saveJob, unsaveJob, listSavedJobs } from "@/lib/jobs.functions";
import { AnalyzeJobSheet } from "@/components/jobs/analyze-job-sheet";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/jobs/detail/$")({
  head: () => ({ meta: [{ title: "Job details — Career Boost" }] }),
  component: JobDetail,
});

function JobDetail() {
  const { _splat } = Route.useParams();
  const slug = decodeURIComponent(_splat ?? "");
  const qc = useQueryClient();
  const getJobFn = useServerFn(getJob);
  const savedFn = useServerFn(listSavedJobs);
  const saveFn = useServerFn(saveJob);
  const unsaveFn = useServerFn(unsaveJob);

  const [analyzeOpen, setAnalyzeOpen] = useState(false);

  const jobQ = useQuery({
    queryKey: ["job-detail", slug],
    queryFn: () => getJobFn({ data: { slug } }),
    enabled: !!slug,
    staleTime: 5 * 60_000,
  });

  const savedQ = useQuery({ queryKey: ["saved-jobs"], queryFn: () => savedFn() });
  const savedRow = (savedQ.data ?? []).find(
    (s) => jobQ.data && s.provider === jobQ.data.provider && s.external_id === jobQ.data.slug,
  );

  const saveM = useMutation({
    mutationFn: async () => {
      const j = jobQ.data!;
      return savedRow
        ? unsaveFn({ data: { provider: j.provider, externalId: j.slug } })
        : saveFn({
            data: {
              provider: j.provider,
              externalId: j.slug,
              title: j.title,
              company: j.company,
              location: j.location,
              employmentType: j.employmentType,
              remote: j.remote,
              postedAt: j.postedAt,
              url: j.url,
              description: j.description.slice(0, 20000),
              tags: j.tags,
            },
          });
    },
    onSuccess: () => {
      toast.success(savedRow ? "Removed from saved" : "Saved");
      qc.invalidateQueries({ queryKey: ["saved-jobs"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (jobQ.isLoading) {
    return <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (jobQ.isError || !jobQ.data) {
    return (
      <Card className="p-6">
        <div className="text-sm text-destructive">
          {jobQ.error instanceof Error ? jobQ.error.message : "Couldn't load this job."}
        </div>
        <Link to="/jobs" className="mt-3 inline-flex items-center gap-1 text-sm text-primary-glow hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to jobs
        </Link>
      </Card>
    );
  }

  const job = jobQ.data;
  const posted = job.postedAt ? new Date(job.postedAt).toLocaleDateString() : "";

  return (
    <div className="space-y-5">
      <Link to="/jobs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to jobs
      </Link>

      <Card className="bg-card-gradient p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-bold md:text-3xl">{job.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {job.company && <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{job.company}</span>}
              {job.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>}
              {posted && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Posted {posted}</span>}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {job.remote && <Badge variant="outline" className="border-primary-glow/40 text-primary-glow">Remote</Badge>}
              {job.employmentType && (
                <Badge variant="outline" className="capitalize">{job.employmentType.replace(/-/g, " ")}</Badge>
              )}
              <Badge variant="outline" className="text-[10px] uppercase tracking-wide opacity-70">{job.provider}</Badge>
              {job.tags.slice(0, 8).map((t) => (
                <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="hero" asChild>
              <a href={job.url} target="_blank" rel="noopener noreferrer">
                Apply <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </a>
            </Button>
            <Button variant="outline" onClick={() => setAnalyzeOpen(true)}>
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Analyze Match
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => saveM.mutate()}
              disabled={saveM.isPending}
              title={savedRow ? "Remove" : "Save"}
            >
              {savedRow ? <BookmarkCheck className="h-4 w-4 text-primary-glow" /> : <Bookmark className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-3 font-display text-lg font-semibold">Job description</h2>
        <JobDescription html={job.description} />
        <div className="mt-6 border-t border-border pt-4">
          <Button variant="hero" asChild>
            <a href={job.url} target="_blank" rel="noopener noreferrer">
              Apply on {job.provider === "adzuna" ? "Adzuna" : "Arbeitnow"} <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </Card>

      <AnalyzeJobSheet open={analyzeOpen} onOpenChange={setAnalyzeOpen} job={job} />
    </div>
  );
}

import DOMPurify from "dompurify";

function JobDescription({ html }: { html: string }) {
  const trimmed = html?.trim() ?? "";
  if (!trimmed) return <p className="text-sm text-muted-foreground">No description provided.</p>;
  const looksLikeHtml = /<[a-z][\s\S]*>/i.test(trimmed);
  if (looksLikeHtml) {
    const safe = typeof window === "undefined"
      ? trimmed.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/ on\w+="[^"]*"/gi, "")
      : DOMPurify.sanitize(trimmed, {
          FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
          FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur", "style"],
        });
    return (
      <div
        className="prose prose-invert max-w-none text-sm leading-relaxed prose-headings:font-display prose-headings:text-foreground prose-p:text-foreground/90 prose-li:text-foreground/90 prose-a:text-primary-glow"
        dangerouslySetInnerHTML={{ __html: safe }}
      />
    );
  }
  return <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{trimmed}</div>;
}
