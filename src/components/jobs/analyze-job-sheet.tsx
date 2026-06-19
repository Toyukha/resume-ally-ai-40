import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Upload, Loader2, Sparkles, ExternalLink, CheckCircle2, AlertTriangle, KeyRound } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { extractTextFromFile } from "@/lib/extract-text";
import { analyzeJobMatch, createApplication, type NormalizedJob } from "@/lib/jobs.functions";
import { MatchScoreRing } from "./match-score-ring";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  job: NormalizedJob;
};

type MatchResult = Awaited<ReturnType<typeof analyzeJobMatch>>;

export function AnalyzeJobSheet({ open, onOpenChange, job }: Props) {
  const [resumeText, setResumeText] = useState("");
  const [filename, setFilename] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const qc = useQueryClient();

  const analyzeFn = useServerFn(analyzeJobMatch);
  const createAppFn = useServerFn(createApplication);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await analyzeFn({
        data: {
          resumeText,
          job: {
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
        },
      });
      return res;
    },
    onSuccess: (r) => {
      setResult(r);
      toast.success("Match analysis complete");
      qc.invalidateQueries({ queryKey: ["jobs-dashboard"] });
      qc.invalidateQueries({ queryKey: ["user-plan"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Analysis failed"),
  });

  const trackM = useMutation({
    mutationFn: () =>
      createAppFn({
        data: {
          provider: job.provider,
          externalId: job.slug,
          title: job.title,
          company: job.company,
          url: job.url,
          status: "applied",
        },
      }),
    onSuccess: () => {
      toast.success("Tracked as applied");
      qc.invalidateQueries({ queryKey: ["applications"] });
      qc.invalidateQueries({ queryKey: ["jobs-dashboard"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to track"),
  });

  const onFile = async (file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Max 5 MB.");
    setExtracting(true);
    try {
      const text = await extractTextFromFile(file);
      setResumeText(text.trim());
      setFilename(file.name);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't read file");
    } finally {
      setExtracting(false);
    }
  };

  const reset = () => {
    setResult(null);
    setResumeText("");
    setFilename("");
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="font-display">{job.title}</SheetTitle>
          <SheetDescription>
            {job.company} {job.location && `· ${job.location}`}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {!result ? (
            <>
              <div>
                <label className="relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-background/50 px-6 py-8 text-center transition-colors hover:border-primary-glow">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <div className="text-sm font-medium">
                    {extracting ? "Reading file..." : filename || "Upload your CV (PDF/DOCX/TXT)"}
                  </div>
                  <div className="text-xs text-muted-foreground">Max 5 MB</div>
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => onFile(e.target.files?.[0] ?? null)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    disabled={extracting}
                  />
                </label>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Or paste resume text</label>
                <Textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your CV..."
                  className="mt-1.5 min-h-[140px] font-mono text-xs"
                />
              </div>

              <Button
                variant="hero"
                className="w-full"
                disabled={resumeText.length < 50 || mutation.isPending}
                onClick={() => mutation.mutate()}
              >
                {mutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing match…</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Analyze Match</>
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-4 rounded-xl border border-border bg-card-gradient p-4">
                <MatchScoreRing score={result.matchScore} size={84} />
                <div>
                  <div className="text-sm font-semibold">ATS Match Score</div>
                  <p className="mt-1 text-xs text-muted-foreground">{result.summary}</p>
                </div>
              </div>

              <Section icon={<CheckCircle2 className="h-4 w-4 text-success" />} title="Strengths">
                <ul className="space-y-1.5 text-sm">
                  {result.strengths.map((s, i) => <li key={i} className="flex gap-2"><span className="text-success">✓</span>{s}</li>)}
                </ul>
              </Section>

              <Section icon={<AlertTriangle className="h-4 w-4 text-gold" />} title="Weaknesses">
                <ul className="space-y-1.5 text-sm">
                  {result.weaknesses.map((s, i) => <li key={i} className="flex gap-2"><span className="text-gold">!</span>{s}</li>)}
                </ul>
              </Section>

              {result.missingKeywords.length > 0 && (
                <Section icon={<KeyRound className="h-4 w-4 text-primary-glow" />} title="Missing Keywords">
                  <div className="flex flex-wrap gap-1.5">
                    {result.missingKeywords.map((k) => (
                      <Badge key={k} variant="outline" className="border-primary-glow/40 text-primary-glow">{k}</Badge>
                    ))}
                  </div>
                </Section>
              )}

              <div className="flex flex-wrap gap-2">
                <Button variant="hero" asChild>
                  <a href={job.url} target="_blank" rel="noopener noreferrer">
                    Apply now <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                  </a>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => trackM.mutate()}
                  disabled={trackM.isPending}
                >
                  {trackM.isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                  Track as Applied
                </Button>
                <Button variant="ghost" onClick={reset}>Re-analyze</Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">{icon}{title}</div>
      {children}
    </div>
  );
}
