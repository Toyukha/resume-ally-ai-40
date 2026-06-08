import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  TrendingUp, AlertTriangle, KeyRound, FileCheck, Mail, Copy, Check, X,
  Loader2, ArrowLeft, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/navbar";
import { getAnalysis } from "@/lib/analyze.functions";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/history/$id")({
  head: () => ({
    meta: [
      { title: "Analysis Details — Get That Job" },
      { name: "description", content: "Review your resume analysis: ATS score, strengths, weaknesses, missing keywords, optimized resume, and cover letter." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AnalysisDetailPage,
});

function AnalysisDetailPage() {
  const { id } = Route.useParams();
  const fetchFn = useServerFn(getAnalysis);

  const { data, isLoading, error } = useQuery({
    queryKey: ["analysis", id],
    queryFn: () => fetchFn({ data: { id } }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto max-w-6xl px-4 py-10">
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto max-w-6xl px-4 py-10">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/history"><ArrowLeft className="mr-2 h-4 w-4" /> Back to history</Link>
          </Button>
          <Card className="p-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 font-display text-lg font-semibold">Analysis not found</h3>
            <p className="mt-1 text-sm text-muted-foreground">This analysis may have been deleted.</p>
          </Card>
        </main>
      </div>
    );
  }

  const result = {
    matchScore: data.match_score,
    summary: data.summary,
    strengths: data.strengths as string[],
    weaknesses: data.weaknesses as string[],
    missingKeywords: data.missing_keywords as string[],
    optimizedResume: data.optimized_resume,
    coverLetter: data.cover_letter,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-6xl px-4 py-10">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/history"><ArrowLeft className="mr-2 h-4 w-4" /> Back to history</Link>
        </Button>

        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold md:text-4xl">Analysis Details</h1>
          <p className="mt-1 text-muted-foreground">
            {data.resume_filename || "Untitled resume"} · {new Date(data.created_at).toLocaleString()}
          </p>
        </div>

        <section className="space-y-6">
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
      </main>
    </div>
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
