import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Upload, FileText, Sparkles, Loader2, Target, TrendingUp,
  AlertTriangle, KeyRound, FileCheck, Mail, Copy, Check, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/navbar";
import { analyzeResume, type AnalysisResult } from "@/lib/analyze.functions";
import { extractTextFromFile } from "@/lib/extract-text";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — ResumeForge" }] }),
  component: Dashboard,
});

function Dashboard() {
  const [resumeText, setResumeText] = useState("");
  const [resumeFile, setResumeFile] = useState<string>("");
  const [jobDescription, setJobDescription] = useState("");
  const [extracting, setExtracting] = useState(false);

  const analyzeFn = useServerFn(analyzeResume);
  const mutation = useMutation({
    mutationFn: async () => analyzeFn({ data: { resumeText, jobDescription } }) as Promise<AnalysisResult>,
    onError: (e) => toast.error(e instanceof Error ? e.message : "Analysis failed"),
    onSuccess: () => {
      toast.success("Analysis complete!");
      setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 100);
    },
  });

  const onFile = async (file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("File too large (max 5 MB).");
    setExtracting(true);
    try {
      const text = await extractTextFromFile(file);
      setResumeText(text.trim());
      setResumeFile(file.name);
      toast.success(`Loaded ${file.name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't read file");
    } finally {
      setExtracting(false);
    }
  };

  const canAnalyze = resumeText.length >= 50 && jobDescription.length >= 30 && !mutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold md:text-4xl">Optimize your resume</h1>
          <p className="mt-1 text-muted-foreground">Upload your resume, paste the job description, and let AI do the heavy lifting.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Resume Upload */}
          <Card className="bg-card-gradient p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary-glow">
                <FileText className="h-4 w-4" />
              </div>
              <h2 className="font-display text-lg font-semibold">Your Resume</h2>
            </div>

            <label className="relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background/50 px-6 py-10 text-center transition-colors hover:border-primary-glow hover:bg-accent/30 cursor-pointer">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <div className="text-sm font-medium">
                {extracting ? "Reading file..." : resumeFile || "Drop a PDF or DOCX, or click to upload"}
              </div>
              <div className="text-xs text-muted-foreground">PDF, DOCX, TXT · max 5 MB</div>
              <input
                type="file"
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
                className="absolute inset-0 cursor-pointer opacity-0"
                disabled={extracting}
              />
            </label>

            <div className="mt-4">
              <label className="text-xs font-medium text-muted-foreground">Or paste resume text</label>
              <Textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume content here..."
                className="mt-1.5 min-h-[180px] resize-y font-mono text-xs"
              />
              <div className="mt-1 text-right text-xs text-muted-foreground">{resumeText.length} chars</div>
            </div>
          </Card>

          {/* Job Description */}
          <Card className="bg-card-gradient p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gold/15 text-gold">
                <Target className="h-4 w-4" />
              </div>
              <h2 className="font-display text-lg font-semibold">Job Description</h2>
            </div>
            <Textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job posting here — responsibilities, requirements, keywords..."
              className="min-h-[330px] resize-y text-sm"
            />
            <div className="mt-1 text-right text-xs text-muted-foreground">{jobDescription.length} chars</div>
          </Card>
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            size="lg" variant="hero"
            disabled={!canAnalyze}
            onClick={() => mutation.mutate()}
            className="min-w-[260px]"
          >
            {mutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing with AI...</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" /> Analyze & Optimize</>
            )}
          </Button>
        </div>

        {mutation.data && <Results result={mutation.data} />}
      </main>
    </div>
  );
}

function Results({ result }: { result: AnalysisResult }) {
  return (
    <section id="results" className="mt-16 space-y-6">
      <div className="text-center">
        <h2 className="font-display text-3xl font-bold md:text-4xl">Your results</h2>
      </div>

      <ScoreCard score={result.matchScore} summary={result.summary} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ListCard
          icon={TrendingUp}
          color="success"
          title="Strengths"
          items={result.strengths}
        />
        <ListCard
          icon={AlertTriangle}
          color="warning"
          title="Weaknesses"
          items={result.weaknesses}
        />
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gold/15 text-gold">
            <KeyRound className="h-4 w-4" />
          </div>
          <h3 className="font-display text-lg font-semibold">Missing Keywords</h3>
        </div>
        {result.missingKeywords.length === 0 ? (
          <p className="text-sm text-muted-foreground">Excellent — no critical keywords missing.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {result.missingKeywords.map((kw) => (
              <Badge key={kw} variant="outline" className="border-gold/40 bg-gold/10 text-foreground">
                <X className="mr-1 h-3 w-3 text-gold" /> {kw}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      <Card className="overflow-hidden p-6">
        <Tabs defaultValue="resume">
          <TabsList>
            <TabsTrigger value="resume"><FileCheck className="mr-2 h-4 w-4" /> Optimized Resume</TabsTrigger>
            <TabsTrigger value="cover"><Mail className="mr-2 h-4 w-4" /> Cover Letter</TabsTrigger>
          </TabsList>
          <TabsContent value="resume" className="mt-4">
            <CopyableText text={result.optimizedResume} />
          </TabsContent>
          <TabsContent value="cover" className="mt-4">
            <CopyableText text={result.coverLetter} />
          </TabsContent>
        </Tabs>
      </Card>
    </section>
  );
}

function ScoreCard({ score, summary }: { score: number; summary: string }) {
  const tone = score >= 80 ? "success" : score >= 60 ? "gold" : "destructive";
  return (
    <Card className="bg-hero overflow-hidden p-8 shadow-elegant md:p-10">
      <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
        <div className="relative">
          <svg className="h-32 w-32 -rotate-90">
            <circle cx="64" cy="64" r="56" stroke="oklch(1 0 0 / 0.2)" strokeWidth="10" fill="none" />
            <circle
              cx="64" cy="64" r="56"
              stroke={tone === "success" ? "oklch(0.85 0.16 145)" : tone === "gold" ? "oklch(0.85 0.15 85)" : "oklch(0.7 0.2 27)"}
              strokeWidth="10" fill="none"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - score / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-display text-4xl font-bold text-primary-foreground">{score}</div>
            <div className="text-xs text-primary-foreground/70">match score</div>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-display text-2xl font-bold text-primary-foreground">
            {score >= 80 ? "Strong match" : score >= 60 ? "Decent fit, room to grow" : "Needs significant work"}
          </h3>
          <p className="mt-2 text-primary-foreground/80">{summary}</p>
        </div>
      </div>
    </Card>
  );
}

function ListCard({ icon: Icon, color, title, items }: {
  icon: typeof TrendingUp; color: "success" | "warning"; title: string; items: string[];
}) {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className={`grid h-8 w-8 place-items-center rounded-lg ${color === "success" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="font-display text-lg font-semibold">{title}</h3>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${color === "success" ? "bg-success" : "bg-warning"}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function CopyableText({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative">
      <Button size="sm" variant="ghost" onClick={copy} className="absolute right-2 top-2 z-10">
        {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
      </Button>
      <pre className="max-h-[500px] overflow-auto whitespace-pre-wrap rounded-lg bg-muted/50 p-5 pr-14 font-sans text-sm leading-relaxed">
        {text}
      </pre>
    </div>
  );
}
