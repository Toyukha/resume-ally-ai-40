import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

export type NormalizedJob = {
  id: string;
  slug: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  employmentType: string;
  postedAt: string;
  url: string;
  description: string;
  tags: string[];
  provider: "arbeitnow";
};

// ────────────────────────────────────────────────────────────────────────────
// Arbeitnow client (server-side, with simple in-memory cache)
// ────────────────────────────────────────────────────────────────────────────

type ArbeitnowJob = {
  slug: string;
  company_name: string;
  title: string;
  description: string;
  remote: boolean;
  url: string;
  tags: string[];
  job_types: string[];
  location: string;
  created_at: number;
};

const cache = new Map<string, { at: number; data: NormalizedJob[] }>();
const CACHE_TTL = 10 * 60 * 1000;

async function fetchArbeitnowPage(page: number): Promise<NormalizedJob[]> {
  const key = `p:${page}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.data;

  const url = `https://www.arbeitnow.com/api/job-board-api?page=${page}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Arbeitnow API error: ${res.status}`);
  const body = (await res.json()) as { data: ArbeitnowJob[] };
  const normalized: NormalizedJob[] = (body.data ?? []).map((j) => ({
    id: j.slug,
    slug: j.slug,
    title: j.title,
    company: j.company_name,
    location: j.location || "",
    remote: !!j.remote,
    employmentType: (j.job_types?.[0] ?? "").toLowerCase(),
    postedAt: new Date((j.created_at ?? 0) * 1000).toISOString(),
    url: j.url,
    description: j.description ?? "",
    tags: j.tags ?? [],
    provider: "arbeitnow",
  }));
  cache.set(key, { at: Date.now(), data: normalized });
  return normalized;
}

const SearchSchema = z.object({
  query: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  remote: z.enum(["any", "remote", "hybrid", "onsite"]).optional(),
  employmentType: z.string().max(50).optional(),
  industry: z.string().max(100).optional(),
  postedWithinDays: z.number().int().min(0).max(180).optional(),
  page: z.number().int().min(1).max(10).optional(),
});
export type JobSearchInput = z.infer<typeof SearchSchema>;

function applyFilters(jobs: NormalizedJob[], f: JobSearchInput): NormalizedJob[] {
  const q = f.query?.toLowerCase().trim();
  const loc = f.location?.toLowerCase().trim();
  const empType = f.employmentType?.toLowerCase().trim();
  const industry = f.industry?.toLowerCase().trim();
  const since = f.postedWithinDays
    ? Date.now() - f.postedWithinDays * 24 * 60 * 60 * 1000
    : null;

  return jobs.filter((j) => {
    if (q) {
      const hay = `${j.title} ${j.company} ${j.tags.join(" ")} ${j.description}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (loc && !j.location.toLowerCase().includes(loc)) return false;
    if (f.remote === "remote" && !j.remote) return false;
    if (f.remote === "onsite" && j.remote) return false;
    // "hybrid" is a heuristic — Arbeitnow tags often include 'hybrid'
    if (f.remote === "hybrid") {
      const tagBlob = j.tags.join(" ").toLowerCase() + " " + j.description.toLowerCase();
      if (!tagBlob.includes("hybrid")) return false;
    }
    if (empType && !j.employmentType.includes(empType) && !j.tags.some((t) => t.toLowerCase().includes(empType))) return false;
    if (industry && !j.tags.some((t) => t.toLowerCase().includes(industry))) return false;
    if (since && new Date(j.postedAt).getTime() < since) return false;
    return true;
  });
}

export const searchJobs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SearchSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    const page = data.page ?? 1;
    // Pull a couple pages for richer client-side filtering
    const [a, b] = await Promise.all([
      fetchArbeitnowPage(page),
      fetchArbeitnowPage(page + 1).catch(() => [] as NormalizedJob[]),
    ]);
    const all = [...a, ...b];
    const filtered = applyFilters(all, data);
    return { jobs: filtered.slice(0, 50), total: filtered.length, page };
  });

export const getJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ slug: z.string().min(1).max(300) }).parse(input))
  .handler(async ({ data }) => {
    for (let p = 1; p <= 3; p++) {
      const jobs = await fetchArbeitnowPage(p);
      const hit = jobs.find((j) => j.slug === data.slug);
      if (hit) return hit;
    }
    throw new Error("Job not found");
  });

// ────────────────────────────────────────────────────────────────────────────
// Saved jobs
// ────────────────────────────────────────────────────────────────────────────

const JobInputSchema = z.object({
  provider: z.string().default("arbeitnow"),
  externalId: z.string().min(1).max(300),
  title: z.string().min(1).max(500),
  company: z.string().max(300).optional(),
  location: z.string().max(300).optional(),
  employmentType: z.string().max(100).optional(),
  remote: z.boolean().optional(),
  postedAt: z.string().optional(),
  url: z.string().max(1000).optional(),
  description: z.string().max(50000).optional(),
  tags: z.array(z.string()).max(40).optional(),
});

export const saveJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => JobInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("saved_jobs")
      .upsert(
        {
          user_id: userId,
          provider: data.provider,
          external_id: data.externalId,
          title: data.title,
          company: data.company ?? null,
          location: data.location ?? null,
          employment_type: data.employmentType ?? null,
          remote: data.remote ?? false,
          posted_at: data.postedAt ?? null,
          url: data.url ?? null,
          description: data.description ?? null,
          tags: data.tags ?? [],
        },
        { onConflict: "user_id,provider,external_id" },
      )
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const unsaveJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ provider: z.string().default("arbeitnow"), externalId: z.string() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("saved_jobs")
      .delete()
      .eq("user_id", context.userId)
      .eq("provider", data.provider)
      .eq("external_id", data.externalId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), favorited: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("saved_jobs")
      .update({ favorited: data.favorited })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listSavedJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("saved_jobs")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ────────────────────────────────────────────────────────────────────────────
// Applications tracker
// ────────────────────────────────────────────────────────────────────────────

const STATUSES = ["saved", "applied", "interview", "assessment", "offer", "rejected"] as const;
export const APP_STATUSES = STATUSES;

const CreateAppSchema = z.object({
  savedJobId: z.string().uuid().nullable().optional(),
  provider: z.string().default("arbeitnow"),
  externalId: z.string().optional(),
  title: z.string().min(1).max(500),
  company: z.string().max(300).optional(),
  url: z.string().max(1000).optional(),
  status: z.enum(STATUSES).default("saved"),
  notes: z.string().max(5000).optional(),
});

export const createApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateAppSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("job_applications")
      .insert({
        user_id: userId,
        saved_job_id: data.savedJobId ?? null,
        provider: data.provider,
        external_id: data.externalId ?? null,
        title: data.title,
        company: data.company ?? null,
        url: data.url ?? null,
        status: data.status,
        notes: data.notes ?? null,
        applied_at: data.status === "applied" ? new Date().toISOString() : null,
      })
      .select("id, status")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateApplicationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(STATUSES) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = {
      status: data.status,
      last_status_at: new Date().toISOString(),
    };
    if (data.status === "applied") patch.applied_at = new Date().toISOString();
    const { error } = await context.supabase
      .from("job_applications")
      .update(patch)
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("job_applications")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("job_applications")
      .select("*")
      .eq("user_id", context.userId)
      .order("last_status_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ────────────────────────────────────────────────────────────────────────────
// Match analysis — wraps the existing analyzer
// ────────────────────────────────────────────────────────────────────────────

const MatchSchema = z.object({
  matchScore: z.number().min(0).max(100),
  summary: z.string(),
  strengths: z.array(z.string()).max(8),
  weaknesses: z.array(z.string()).max(8),
  missingKeywords: z.array(z.string()).max(20),
});

const AnalyzeJobSchema = z.object({
  resumeText: z.string().min(50).max(50000),
  job: JobInputSchema,
});

export const analyzeJobMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AnalyzeJobSchema.parse(input))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI service is not configured.");

    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Plan + admin gating (mirrors analyzeResume)
    const { data: rolesRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("suspended", false)
      .in("role", ["admin", "super_admin"])
      .limit(1)
      .maybeSingle();
    const isAdmin = !!rolesRow;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("plan, plan_tier, pro_expires_at")
      .eq("id", userId)
      .maybeSingle();

    if (!isAdmin) {
      const proActive = profile?.plan === "pro" && profile?.pro_expires_at &&
        new Date(profile.pro_expires_at).getTime() > Date.now();
      const effectiveTier = proActive ? (profile?.plan_tier as string ?? "free") : "free";
      const { getMonthlyLimit } = await import("./plans");
      const limit = getMonthlyLimit(effectiveTier as never);
      if (limit !== null) {
        const monthStart = new Date();
        monthStart.setUTCDate(1);
        monthStart.setUTCHours(0, 0, 0, 0);
        const { count } = await supabaseAdmin
          .from("analyses")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", monthStart.toISOString());
        if ((count ?? 0) >= limit) {
          throw new Error(
            effectiveTier === "free"
              ? "Free plan limit reached: 1 CV analysis per month. Upgrade to Pro for more."
              : `Monthly limit reached (${limit} analyses). Upgrade for more capacity.`,
          );
        }
      }
    }

    // Strip basic HTML from job description for cleaner prompts
    const jobText = (data.job.description ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const jobDescription =
      `Title: ${data.job.title}\nCompany: ${data.job.company ?? ""}\nLocation: ${data.job.location ?? ""}\n\n${jobText}`;

    const gateway = createLovableAiGatewayProvider(apiKey);
    const system = `You are an elite ATS-style resume/job matcher. Given a resume and a job description, return JSON:
- matchScore: 0-100 numeric fit score
- summary: 2 short sentences explaining the score
- strengths: 3-6 concrete bullet phrases
- weaknesses: 3-6 concrete gaps
- missingKeywords: 5-15 ATS-relevant keywords missing from the resume
Never invent employers, degrees, or dates. Confident, specific, ATS-friendly tone.`;

    const prompt = `RESUME:\n"""\n${data.resumeText}\n"""\n\nJOB DESCRIPTION:\n"""\n${jobDescription}\n"""`;

    let result: z.infer<typeof MatchSchema> | null = null;
    for (const model of ["google/gemini-2.5-flash", "google/gemini-2.5-pro"]) {
      try {
        const gen = await generateText({
          model: gateway(model),
          system,
          prompt,
          experimental_output: Output.object({ schema: MatchSchema }),
        });
        result = gen.experimental_output as z.infer<typeof MatchSchema>;
        break;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("429")) throw new Error("Rate limit reached. Try again in a moment.");
        if (msg.includes("402")) throw new Error("AI credits exhausted.");
        if (model === "google/gemini-2.5-pro") throw new Error(`Match analysis failed: ${msg}`);
      }
    }
    if (!result) throw new Error("Match analysis failed.");

    // Persist to analyses (so it counts toward usage + shows in history)
    const { data: analysis } = await supabaseAdmin
      .from("analyses")
      .insert({
        user_id: userId,
        resume_filename: `Job match: ${data.job.title}`.slice(0, 250),
        resume_text: data.resumeText,
        job_description: jobDescription,
        match_score: result.matchScore,
        summary: result.summary,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        missing_keywords: result.missingKeywords,
        optimized_resume: "",
        cover_letter: "",
      })
      .select("id")
      .single();

    // Link to job_matches for recommendations / dashboard widgets
    await supabase.from("job_matches").insert({
      user_id: userId,
      analysis_id: analysis?.id ?? null,
      provider: data.job.provider,
      external_id: data.job.externalId,
      title: data.job.title,
      company: data.job.company ?? null,
      match_score: result.matchScore,
    });

    return { ...result, analysisId: analysis?.id ?? null };
  });

// ────────────────────────────────────────────────────────────────────────────
// Recommendations
// ────────────────────────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  "the","and","for","with","you","are","our","your","that","this","from","have","will","not",
  "but","they","their","has","was","were","been","into","more","than","over","other","such","very",
  "all","any","can","may","one","two","new","work","team","role","job","experience","year","years",
  "skills","skill","good","strong","ability","including","using","use","used","across","within",
  "etc","day","days","week","weeks","month","months","like","also","make","made","help","working",
]);

function topKeywords(text: string, limit = 8): string[] {
  const freq = new Map<string, number>();
  for (const raw of text.toLowerCase().split(/[^a-z0-9+#.]+/)) {
    const w = raw.trim();
    if (w.length < 3 || w.length > 30) continue;
    if (STOPWORDS.has(w)) continue;
    if (/^\d+$/.test(w)) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([w]) => w);
}

export const recommendJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: latest } = await supabase
      .from("analyses")
      .select("resume_text, missing_keywords, strengths")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latest?.resume_text) {
      return { jobs: [] as NormalizedJob[], keywords: [] as string[], hasResume: false };
    }

    const fromResume = topKeywords(latest.resume_text, 8);
    const fromMissing = (latest.missing_keywords as string[] | null) ?? [];
    const keywords = Array.from(new Set([...fromMissing.slice(0, 4), ...fromResume])).slice(0, 8);

    // Pull a couple pages and score
    const all = [
      ...(await fetchArbeitnowPage(1).catch(() => [])),
      ...(await fetchArbeitnowPage(2).catch(() => [])),
    ];
    const scored = all.map((j) => {
      const hay = `${j.title} ${j.tags.join(" ")} ${j.description}`.toLowerCase();
      let score = 0;
      for (const kw of keywords) if (hay.includes(kw)) score += 1;
      const ageDays = (Date.now() - new Date(j.postedAt).getTime()) / (24 * 60 * 60 * 1000);
      const recency = Math.max(0, 1 - ageDays / 30);
      return { job: j, score: score + recency };
    });
    scored.sort((a, b) => b.score - a.score);
    const jobs = scored.filter((s) => s.score > 0).slice(0, 12).map((s) => s.job);
    return { jobs, keywords, hasResume: true };
  });

// ────────────────────────────────────────────────────────────────────────────
// Dashboard widgets
// ────────────────────────────────────────────────────────────────────────────

export const getJobsDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [savedRes, appsRes, matchesRes] = await Promise.all([
      supabase.from("saved_jobs").select("id, title, company, url, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
      supabase.from("job_applications").select("status").eq("user_id", userId),
      supabase.from("job_matches").select("title, company, match_score, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
    ]);
    const counts: Record<string, number> = { saved: 0, applied: 0, interview: 0, assessment: 0, offer: 0, rejected: 0 };
    for (const a of appsRes.data ?? []) counts[(a as { status: string }).status] = (counts[(a as { status: string }).status] ?? 0) + 1;
    return {
      savedCount: (savedRes.data ?? []).length,
      recentSaved: savedRes.data ?? [],
      recentMatches: matchesRes.data ?? [],
      applicationCounts: counts,
    };
  });
