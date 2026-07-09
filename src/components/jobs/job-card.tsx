import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Bookmark, BookmarkCheck, ExternalLink, MapPin, Building2, Clock, Sparkles, Star, FileText, Share2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { saveJob, unsaveJob, toggleFavorite, type NormalizedJob } from "@/lib/jobs.functions";
import { flagForLocation } from "@/lib/job-countries";
import { WHATSAPP_GROUP_URL, trackJobWhatsAppShare } from "@/lib/whatsapp";
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
                <span className="flex items-center gap-1">
                  <span className="text-sm leading-none">{flagForLocation(job.location)}</span>
                  <MapPin className="h-3 w-3" />{job.location}
                </span>
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
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              const detailUrl = `${window.location.origin}/jobs/detail/${encodeURIComponent(job.slug)}`;
              const shareText = `${job.title} at ${job.company || "Career Boost"} — ${detailUrl}`;
              try {
                await navigator.clipboard.writeText(shareText);
                toast.success("Job details copied. Join the WhatsApp group to share it.");
              } catch {
                toast.error("Could not copy job details.");
              }
              trackJobWhatsAppShare("job_card");
              window.open(WHATSAPP_GROUP_URL, "_blank", "noopener,noreferrer");
            }}
            className="gap-1.5 border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10 hover:text-[#128C7E]"
          >
            <WhatsAppIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Share</span>
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

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
