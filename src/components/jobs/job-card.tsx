import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Bookmark, BookmarkCheck, ExternalLink, MapPin, Building2, Clock, Sparkles, Star, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { saveJob, unsaveJob, toggleFavorite, type NormalizedJob } from "@/lib/jobs.functions";
import { toast } from "sonner";
import { AnalyzeJobSheet } from "./analyze-job-sheet";

type Props = {
  job: NormalizedJob;
  savedId?: string | null;
  favorited?: boolean;
};

export function JobCard({ job, savedId, favorited }: Props) {
  const qc = useQueryClient();
  const [analyzeOpen, setAnalyzeOpen] = useState(false);

  const saveFn = useServerFn(saveJob);
  const unsaveFn = useServerFn(unsaveJob);
  const favFn = useServerFn(toggleFavorite);

  const saveM = useMutation({
    mutationFn: async () =>
      savedId
        ? unsaveFn({ data: { provider: job.provider, externalId: job.slug } })
        : saveFn({
            data: {
              provider: job.provider,
              externalId: job.slug,
              title: job.title,
              company: job.company,
              location: job.location,
              employmentType: job.employmentType,
              remote: job.remote,
              postedAt: job.postedAt,
              url: job.url,
              description: job.description.slice(0, 20000),
              tags: job.tags,
            },
          }),
    onSuccess: () => {
      toast.success(savedId ? "Removed from saved" : "Saved");
      qc.invalidateQueries({ queryKey: ["saved-jobs"] });
      qc.invalidateQueries({ queryKey: ["jobs-dashboard"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const favM = useMutation({
    mutationFn: () => favFn({ data: { id: savedId!, favorited: !favorited } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-jobs"] }),
  });

  const posted = job.postedAt ? timeAgo(new Date(job.postedAt)) : "";

  return (
    <>
      <Card className="group flex flex-col gap-3 bg-card-gradient p-5 transition-all hover:border-primary-glow/40 hover:shadow-glow">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 font-display text-base font-semibold leading-tight">{job.title}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {job.company && (
                <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{job.company}</span>
              )}
              {job.location && (
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
              )}
              {posted && (
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{posted}</span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {savedId && (
              <button
                onClick={() => favM.mutate()}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-gold"
                title={favorited ? "Unfavorite" : "Favorite"}
              >
                <Star className={`h-4 w-4 ${favorited ? "fill-gold text-gold" : ""}`} />
              </button>
            )}
            <button
              onClick={() => saveM.mutate()}
              disabled={saveM.isPending}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-primary-glow"
              title={savedId ? "Remove" : "Save"}
            >
              {savedId ? <BookmarkCheck className="h-4 w-4 text-primary-glow" /> : <Bookmark className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {job.remote && <Badge variant="outline" className="border-primary-glow/40 text-primary-glow">Remote</Badge>}
          {job.employmentType && (
            <Badge variant="outline" className="capitalize">{job.employmentType.replace(/-/g, " ")}</Badge>
          )}
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide opacity-70">
            {job.provider}
          </Badge>
          {job.tags.slice(0, 3).map((t) => (
            <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
          ))}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="hero" onClick={() => setAnalyzeOpen(true)} className="flex-1">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Analyze Match
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link
              to="/jobs/detail/$"
              params={{ _splat: encodeURIComponent(job.slug) }}
            >
              <FileText className="mr-1.5 h-3.5 w-3.5" /> Details
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href={job.url} target="_blank" rel="noopener noreferrer">
              Apply <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </Card>
      <AnalyzeJobSheet open={analyzeOpen} onOpenChange={setAnalyzeOpen} job={job} />
    </>
  );
}

function timeAgo(d: Date) {
  const sec = (Date.now() - d.getTime()) / 1000;
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  const days = Math.floor(sec / 86400);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
