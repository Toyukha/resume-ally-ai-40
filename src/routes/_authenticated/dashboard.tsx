import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Upload, FileText, Sparkles, Loader2, Target, TrendingUp,
  AlertTriangle, KeyRound, FileCheck, Mail, Copy, Check, X, Lock, Crown, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/navbar";
import { JobsWidgets } from "@/components/jobs/jobs-widgets";
import {
  analyzeResume,
  getUserPlan,
  type AnalysisResult,
} from "@/lib/analyze.functions";
import { refreshSubscriptionStatus } from "@/lib/flutterwave.functions";
import { extractTextFromFile } from "@/lib/extract-text";
import { supabase } from "@/integrations/supabase/client";
import { trackPwaEvent } from "@/lib/pwa-analytics";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Career Boost" }] }),
  validateSearch: (s: Record<string, unknown>): { upgraded?: 1; checkout?: "success" } => ({
    upgraded: s.upgraded === 1 || s.upgraded === "1" ? 1 : undefined,
    checkout: s.checkout === "success" ? ("success" as const) : undefined,
  }),
  component: Dashboard,
});



function Dashboard() {
  const search = Route.useSearch();
  const justUpgraded = search.upgraded === 1 || search.checkout === "success";

  // Track the first dashboard visit that happens from an installed PWA
  // (standalone display mode). Fires once per browser via localStorage flag.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const KEY = "cb_pwa_first_dash_logged";
    if (window.localStorage.getItem(KEY)) return;
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (!standalone) return;
    window.localStorage.setItem(KEY, String(Date.now()));
    void trackPwaEvent("first_dashboard_visit_installed");
  }, []);

  const [resumeText, setResumeText] = useState("");
  const [resumeFile, setResumeFile] = useState<string>("");
  const [resumeBlob, setResumeBlob] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [pollWindowOpen, setPollWindowOpen] = useState(justUpgraded);
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugData, setDebugData] = useState<{
    plan: Awaited<ReturnType<typeof getUserPlan>> | null;
    refresh: Awaited<ReturnType<typeof refreshSubscriptionStatus>> | null;
    at: string;
  } | null>(null);
  const [debugLoading, setDebugLoading] = useState(false);

  const planFn = useServerFn(getUserPlan);
  const planQuery = useQuery({
    queryKey: ["user-plan"],
    queryFn: () => planFn(),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: pollWindowOpen ? 2000 : false,
  });

  // Stop polling once Pro is detected, and cap the polling window to 30s.
  useEffect(() => {
    if (!pollWindowOpen) return;
    if (planQuery.data?.plan === "pro") {
      setPollWindowOpen(false);
      return;
    }
    const t = setTimeout(() => setPollWindowOpen(false), 30_000);
    return () => clearTimeout(t);
  }, [pollWindowOpen, planQuery.data?.plan]);

  // Show a one-time toast when arriving from a Flutterwave success redirect.
  useEffect(() => {
    if (search.upgraded === 1 || search.checkout === "success") {
      toast.success("Payment received — activating your Pro plan…");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const analyzeFn = useServerFn(analyzeResume);
  const refreshFn = useServerFn(refreshSubscriptionStatus);
  const queryClient = useQueryClient();
  const refreshMutation = useMutation({
    mutationFn: () => refreshFn(),
    onSuccess: (res) => {
      // Seed the cache from the authoritative refresh result so the badge
      // updates immediately, then refetch in the background to pick up
      // usage counters and admin flags.
      const reconciledPlan: "free" | "pro" = res.planTier && res.planTier !== "free" ? "pro" : "free";
      queryClient.setQueryData(["user-plan"], (prev: Record<string, unknown> | undefined) => ({
        ...(prev ?? {}),
        plan: reconciledPlan,
        planTier: res.planTier ?? "free",
        proExpiresAt: res.proExpiresAt ?? null,
        proExpired: false,
      }));
      planQuery.refetch();
      if (res.changed) {
        toast.success(`Subscription updated to ${res.planTier === "pro_2" ? "Pro Plan 2" : res.planTier === "pro_1" ? "Pro Plan 1" : res.planTier}.`);
      } else if (res.reason === "no_successful_payment") {
        toast.info("No verified payment found on your account.");
      } else {
        toast.success("Your subscription is already up to date.");
      }
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Refresh failed"),
  });


  const mutation = useMutation({
    mutationFn: async () => {
      // Best-effort: upload the original file to the private `resumes` bucket.
      let storagePath: string | undefined;
      if (resumeBlob) {
        const { data: u } = await supabase.auth.getUser();
        const uid = u.user?.id;
        if (uid) {
          const safe = resumeBlob.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const path = `${uid}/${crypto.randomUUID()}-${safe}`;
          const { error } = await supabase.storage
            .from("resumes")
            .upload(path, resumeBlob, { contentType: resumeBlob.type || undefined, upsert: false });
          if (!error) storagePath = path;
          else console.warn("[dashboard] resume upload failed:", error.message);
        }
      }
      setResult(null);
      const res = await analyzeFn({
        data: {
          resumeText,
          jobDescription,
          resumeFilename: resumeFile || undefined,
          resumeStoragePath: storagePath,
        },
      });
      return res;
    },
    onSuccess: (res) => {
      setResult(res);
      toast.success("Analysis complete!");
      planQuery.refetch();
      setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 100);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Analysis failed"),
  });

  const onFile = async (file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("File too large (max 5 MB).");
    setExtracting(true);
    try {
      const text = await extractTextFromFile(file);
      setResumeText(text.trim());
      setResumeFile(file.name);
      setResumeBlob(file);
      toast.success(`Loaded ${file.name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't read file");
    } finally {
      setExtracting(false);
    }
  };

  const plan = planQuery.data?.plan ?? "free";
  const planTier = planQuery.data?.planTier ?? "free";
  const isAdmin = planQuery.data?.isAdmin ?? false;
  const isFree = plan === "free";
  const proExpired = planQuery.data?.proExpired ?? false;
  const proExpiresAt = planQuery.data?.proExpiresAt ?? null;
  const analysesThisMonth = planQuery.data?.analysesThisMonth ?? 0;
  const monthlyLimit = planQuery.data?.monthlyLimit ?? null;
  const remaining = planQuery.data?.remaining ?? null;
  const limitReached = monthlyLimit !== null && analysesThisMonth >= monthlyLimit;
  const isAnalyzing = mutation.isPending;
  const canAnalyze = resumeText.length >= 50 && jobDescription.length >= 30 && !isAnalyzing && !limitReached && !proExpired;


  const planLabel = isAdmin
    ? "Admin · Unlimited"
    : planTier === "pro_2" ? "Pro Plan 2"
    : planTier === "pro_1" ? "Pro Plan 1"
    : planTier === "pro_legacy" ? "Pro (Legacy)"
    : "Free plan";

  const runDebugCheck = async () => {
    setDebugLoading(true);
    try {
      const [planRes, refreshRes] = await Promise.all([planFn(), refreshFn()]);
      setDebugData({ plan: planRes, refresh: refreshRes, at: new Date().toISOString() });
      setDebugOpen(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Debug check failed");
    } finally {
      setDebugLoading(false);
    }
  };

  // The UI badge is rendered from planQuery.data (getUserPlan).
  const uiSource = "getUserPlan (planQuery cache)";
  const planTierFromPlan = debugData?.plan?.planTier ?? null;
  const planTierFromRefresh = debugData?.refresh?.planTier ?? null;
  const tiersAgree = planTierFromPlan === planTierFromRefresh;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold md:text-4xl">Optimize your resume</h1>
            <p className="mt-1 text-muted-foreground">Upload your resume, paste the job description, and let AI do the heavy lifting.</p>
          </div>
          {planQuery.data && (
            <Card className={`flex items-center gap-3 px-4 py-2.5 ${isFree ? "border-gold/40 bg-gold/5" : "border-primary/40 bg-primary/5"}`}>
              {isFree ? <Lock className="h-4 w-4 text-gold" /> : <Crown className="h-4 w-4 text-primary-glow" />}
              <div className="text-sm">
                <div className="font-semibold">{planLabel}</div>
                <div className="text-xs text-muted-foreground">
                  {monthlyLimit === null
                    ? "Unlimited analyses"
                    : `${analysesThisMonth}/${monthlyLimit} analyses used this month`}
                  {proExpiresAt && plan === "pro" && (
                    <> · Expires {new Date(proExpiresAt).toLocaleDateString()}</>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => refreshMutation.mutate()}
                disabled={refreshMutation.isPending}
                title="Re-check your latest verified payment and update your plan"
              >
                {refreshMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="ml-1.5 hidden sm:inline">Refresh status</span>
              </Button>
              {(isFree || planTier === "pro_1") && (
                <Button size="sm" variant="gold" asChild>
                  <Link to="/pricing">Upgrade</Link>
                </Button>
              )}
            </Card>
          )}
        </div>

        {/* Debug: compare getUserPlan vs refreshSubscriptionStatus (admin-only) */}
        {isAdmin && (
        <div className="mb-6">
          <Button
            size="sm"
            variant="ghost"
            onClick={runDebugCheck}
            disabled={debugLoading}
            className="text-xs text-muted-foreground"
          >
            {debugLoading ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : null}
            Debug: compare plan sources
          </Button>
          {debugOpen && debugData && (
            <Card className={`mt-2 p-4 text-xs ${tiersAgree ? "border-success/40 bg-success/5" : "border-destructive/40 bg-destructive/5"}`}>
              <div className="mb-2 flex items-center justify-between">
                <div className="font-semibold">
                  Plan source comparison · {tiersAgree ? "✅ in sync" : "⚠️ mismatch"}
                </div>
                <Button size="sm" variant="ghost" onClick={() => setDebugOpen(false)} className="h-6 px-2">
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="mb-2 text-muted-foreground">
                UI is rendering from: <span className="font-mono text-foreground">{uiSource}</span> ·
                {" "}badge tier: <span className="font-mono text-foreground">{planTier}</span> ·
                {" "}checked at {new Date(debugData.at).toLocaleTimeString()}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <div className="mb-1 font-semibold">getUserPlan</div>
                  <pre className="overflow-auto rounded bg-background/60 p-2 font-mono text-[10px]">
{JSON.stringify(debugData.plan, null, 2)}
                  </pre>
                </div>
                <div>
                  <div className="mb-1 font-semibold">refreshSubscriptionStatus</div>
                  <pre className="overflow-auto rounded bg-background/60 p-2 font-mono text-[10px]">
{JSON.stringify(debugData.refresh, null, 2)}
                  </pre>
                </div>
              </div>
              {!tiersAgree && (
                <div className="mt-2 text-destructive">
                  planTier differs: getUserPlan={String(planTierFromPlan)} · refresh={String(planTierFromRefresh)}.
                  Click "Refresh status" above to reconcile.
                </div>
              )}
            </Card>
          )}
        </div>
        )}




        {/* Usage widget — three counters tick down together (bundled per analysis) */}
        {planQuery.data && !isAdmin && monthlyLimit !== null && (
          <div className="mb-6 grid gap-3 md:grid-cols-3">
            <UsageMeter label="CV Analyses Remaining" remaining={remaining ?? 0} total={monthlyLimit} />
            <UsageMeter label="Cover Letters Remaining" remaining={planTier === "free" ? 0 : (remaining ?? 0)} total={planTier === "free" ? 0 : monthlyLimit} freeLocked={planTier === "free"} />
            <UsageMeter label="Optimized CVs Remaining" remaining={planTier === "free" ? 0 : (remaining ?? 0)} total={planTier === "free" ? 0 : monthlyLimit} freeLocked={planTier === "free"} />
          </div>
        )}

        {proExpired && (
          <Card className="mb-6 border-destructive/40 bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <Lock className="mt-0.5 h-5 w-5 text-destructive" />
              <div className="flex-1">
                <div className="font-semibold">Your Pro subscription has expired</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {proExpiresAt
                    ? `Your 30-day Pro access ended on ${new Date(proExpiresAt).toLocaleDateString()}. `
                    : "Your Pro access has ended. "}
                  Renew to resume your analyses, ATS optimization, and cover letters.
                </p>
              </div>
              <Button variant="gold" asChild>
                <Link to="/pricing">Renew Pro</Link>
              </Button>
            </div>
          </Card>
        )}

        {limitReached && !proExpired && (
          <Card className="mb-6 border-gold/40 bg-gold/5 p-4">
            <div className="flex items-start gap-3">
              <Lock className="mt-0.5 h-5 w-5 text-gold" />
              <div className="flex-1">
                <div className="font-semibold">You've used all your analyses for this month</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isFree
                    ? "Upgrade to Pro Plan 1 or Pro Plan 2 for more CV analyses, ATS optimization, and tailored cover letters."
                    : "Upgrade to Pro Plan 2 for double the monthly capacity and priority processing."}
                </p>
              </div>
              <Button variant="gold" asChild>
                <Link to="/pricing">{isFree ? "Upgrade to Pro" : "Upgrade plan"}</Link>
              </Button>
            </div>
          </Card>
        )}

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
            {isAnalyzing ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing…</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" /> Analyze & Optimize</>
            )}
          </Button>
        </div>


        {result && <Results result={result} />}

        <JobsWidgets />

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

      {result.plan !== "free" && (
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
      )}

      {result.plan === "free" ? (
        <Card className="border-gold/40 bg-gold/5 p-8 text-center">
          <Lock className="mx-auto h-8 w-8 text-gold" />
          <h3 className="mt-3 font-display text-xl font-semibold">Unlock optimized resume & cover letter</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Pro members get a fully rewritten, ATS-tailored resume and a custom cover letter for every analysis — plus unlimited analyses and missing-keyword insights.
          </p>
          <Button variant="gold" className="mt-5" asChild>
            <Link to="/" hash="pricing">Upgrade to Pro</Link>
          </Button>
        </Card>
      ) : (
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
      )}
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

function UsageMeter({ label, remaining, total, freeLocked = false }: { label: string; remaining: number; total: number; freeLocked?: boolean }) {
  const pct = total > 0 ? Math.min(100, Math.round((remaining / total) * 100)) : 0;
  const tone = freeLocked
    ? "bg-muted-foreground/30"
    : pct > 50 ? "bg-success" : pct > 20 ? "bg-gold" : "bg-destructive";
  return (
    <Card className="p-4">
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="font-display text-sm font-semibold">
          {freeLocked ? <span className="text-muted-foreground">Pro only</span> : <>{remaining} <span className="text-muted-foreground">/ {total}</span></>}
        </div>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full transition-all ${tone}`} style={{ width: `${freeLocked ? 0 : pct}%` }} />
      </div>
    </Card>
  );
}

