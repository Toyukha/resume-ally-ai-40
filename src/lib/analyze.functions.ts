import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { Tables } from "@/integrations/supabase/types";
import { getMonthlyLimit, type PlanTier } from "./plans";


const InputSchema = z.object({
  resumeText: z.string().min(50, "Resume text is too short").max(50000),
  jobDescription: z.string().min(30, "Job description is too short").max(20000),
  resumeFilename: z.string().max(255).optional(),
});

export const AnalysisSchema = z.object({
  matchScore: z.number().min(0).max(100),
  summary: z.string(),
  strengths: z.array(z.string()).max(10),
  weaknesses: z.array(z.string()).max(10),
  missingKeywords: z.array(z.string()).max(25),
  optimizedResume: z.string(),
  coverLetter: z.string(),
});

const FreeAnalysisSchema = z.object({
  matchScore: z.number().min(0).max(100),
  summary: z.string(),
  strengths: z.array(z.string()).max(10),
  weaknesses: z.array(z.string()).max(10),
});

export type AnalysisResult = z.infer<typeof AnalysisSchema> & { plan?: "free" | "pro" };

const LOCKED_MESSAGE = "🔒 Upgrade to Pro to unlock optimized resume generation and tailored cover letters.";

type PlanRow = {
  plan: string | null;
  plan_tier: string | null;
  pro_started_at: string | null;
  pro_expires_at: string | null;
};

function resolvePlanStatus(profile: PlanRow | null) {
  const rawPlan = (profile?.plan ?? "free") as "free" | "pro";
  const rawTier = (profile?.plan_tier ?? "free") as PlanTier;
  const expiresAt = profile?.pro_expires_at ? new Date(profile.pro_expires_at) : null;
  const proActive = rawPlan === "pro" && expiresAt !== null && expiresAt.getTime() > Date.now();
  const proExpired = rawPlan === "pro" && !proActive;
  // When pro expires, effective tier falls back to free regardless of stored tier.
  const effectiveTier: PlanTier = proActive ? rawTier : "free";
  const effectivePlan: "free" | "pro" = proActive ? "pro" : "free";
  return {
    rawPlan,
    rawTier,
    effectiveTier,
    effectivePlan,
    proActive,
    proExpired,
    expiresAt,
    startedAt: profile?.pro_started_at ?? null,
  };
}


async function isAdminUser(_supabase: unknown, userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("suspended", false)
    .in("role", ["admin", "super_admin"])
    .limit(1)
    .maybeSingle();
  return !!data;
}

export const getUserPlan = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const admin = await isAdminUser(supabase as never, userId);
    const { data } = await supabase
      .from("profiles")
      .select("plan, plan_tier, pro_started_at, pro_expires_at")
      .eq("id", userId)
      .maybeSingle();
    const status = resolvePlanStatus(data as PlanRow | null);

    // Count this month's analyses (calendar-month reset)
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("analyses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", monthStart.toISOString());

    const monthlyLimit = admin ? null : getMonthlyLimit(status.effectiveTier);
    const used = count ?? 0;
    const remaining = monthlyLimit === null ? null : Math.max(0, monthlyLimit - used);

    return {
      plan: admin ? ("pro" as const) : status.effectivePlan,
      planTier: admin ? ("pro_legacy" as PlanTier) : status.effectiveTier,
      rawPlan: status.rawPlan,
      rawTier: status.rawTier,
      isAdmin: admin,
      proExpired: admin ? false : status.proExpired,
      proExpiresAt: status.expiresAt?.toISOString() ?? null,
      proStartedAt: status.startedAt,
      analysesThisMonth: used,
      monthlyLimit,
      remaining,
    };
  });


export const analyzeResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI service is not configured.");

    const { supabase, userId } = context;

    const admin = await isAdminUser(supabase as never, userId);

    // Determine plan & subscription status
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, plan_tier, pro_started_at, pro_expires_at")
      .eq("id", userId)
      .maybeSingle();
    const status = resolvePlanStatus(profile as PlanRow | null);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Admins bypass all subscription gating
    if (!admin) {
      // Block expired Pro users — they must renew before analyzing again
      if (status.proExpired) {
        throw new Error("Your Pro subscription has expired. Please renew to continue running analyses.");
      }

      // Enforce monthly tier limit (resets at the start of each calendar month)
      const limit = getMonthlyLimit(status.effectiveTier);
      if (limit !== null) {
        const monthStart = new Date();
        monthStart.setUTCDate(1);
        monthStart.setUTCHours(0, 0, 0, 0);
        const { count, error: countError } = await supabaseAdmin
          .from("analyses")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", monthStart.toISOString());
        if (countError) throw new Error(`Unable to verify plan usage: ${countError.message}`);
        if ((count ?? 0) >= limit) {
          if (status.effectiveTier === "free") {
            throw new Error("Free plan limit reached: 1 CV analysis per month. Upgrade to Pro for more analyses.");
          }
          throw new Error(`Monthly limit reached (${limit} analyses). Upgrade to a higher plan for more capacity.`);
        }
      }
    }

    const plan: "free" | "pro" = admin ? "pro" : status.effectivePlan;

    const gateway = createLovableAiGatewayProvider(apiKey);
    const PRIMARY_MODEL = "google/gemini-2.5-flash";
    const FALLBACK_MODEL = "google/gemini-2.5-pro";

    const isFree = plan === "free";


    const system = isFree
      ? `You are a resume analysis assistant. Analyze the candidate's resume against the target job description and return:
- matchScore: 0-100 numeric fit score
- summary: 2 short sentences explaining the score
- strengths: 3-6 concrete bullet phrases
- weaknesses: 3-6 concrete gaps the candidate should address
Tone: confident, specific, ATS-friendly.`
      : `You are an elite resume optimization assistant. Analyze the candidate's resume against the target job description.
Return a JSON object with:
- matchScore: 0-100 numeric fit score
- summary: 2 short sentences explaining the score
- strengths: 3-6 concrete bullet phrases
- weaknesses: 3-6 concrete gaps the candidate should address
- missingKeywords: 5-15 ATS-relevant keywords missing from the resume
- optimizedResume: a rewritten resume tailored to the job, in clean Markdown with sections (Summary, Experience, Skills, Education). Keep all factual claims grounded in the original resume.
- coverLetter: a 3-paragraph professional cover letter (~250 words) tailored to the role.

Never invent employers, degrees, or dates. Tone: confident, specific, ATS-friendly.`;

    const prompt = `RESUME:\n"""\n${data.resumeText}\n"""\n\nJOB DESCRIPTION:\n"""\n${data.jobDescription}\n"""`;

    let result!: z.infer<typeof AnalysisSchema>;
    const schema = isFree ? FreeAnalysisSchema : AnalysisSchema;
    const attempts: { model: string; ok: boolean; error?: string; rawPreview?: string }[] = [];

    const runOnce = async (modelId: string) => {
      const gen = await generateText({
        model: gateway(modelId),
        system,
        prompt,
        experimental_output: Output.object({ schema }),
      });
      return gen;
    };

    const isSchemaMismatch = (msg: string) =>
      /did not match schema|No object generated|validation|invalid_type|Expected/i.test(msg);

    let lastError: unknown = null;
    for (const modelId of [PRIMARY_MODEL, FALLBACK_MODEL]) {
      try {
        const gen = await runOnce(modelId);
        const raw = (() => {
          try { return JSON.stringify(gen.experimental_output); } catch { return String(gen.text ?? ""); }
        })();
        console.log(`[analyze] model=${modelId} userId=${userId} plan=${plan} ok=true rawLen=${raw.length} preview=${raw.slice(0, 500)}`);
        attempts.push({ model: modelId, ok: true, rawPreview: raw.slice(0, 200) });

        if (isFree) {
          const free = gen.experimental_output as z.infer<typeof FreeAnalysisSchema>;
          result = {
            ...free,
            missingKeywords: [],
            optimizedResume: LOCKED_MESSAGE,
            coverLetter: LOCKED_MESSAGE,
          };
        } else {
          result = gen.experimental_output as z.infer<typeof AnalysisSchema>;
        }
        lastError = null;
        break;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        const rawText = (err as { text?: string; response?: { text?: string } })?.text
          ?? (err as { response?: { text?: string } })?.response?.text
          ?? "";
        console.error(`[analyze] model=${modelId} userId=${userId} plan=${plan} ok=false error=${message} rawPreview=${rawText.slice(0, 500)}`);
        attempts.push({ model: modelId, ok: false, error: message, rawPreview: rawText.slice(0, 200) });
        lastError = err;
        if (message.includes("429")) throw new Error("Rate limit reached. Please wait a moment and try again.");
        if (message.includes("402")) throw new Error("AI credits exhausted. Please add credits in workspace billing.");
        // Only fall back on schema-mismatch style errors; rethrow other errors immediately.
        if (!isSchemaMismatch(message)) throw new Error(`Analysis failed: ${message}`);
        // else: loop and try fallback model
      }
    }

    if (lastError) {
      const message = lastError instanceof Error ? lastError.message : String(lastError);
      console.error(`[analyze] all models failed userId=${userId} attempts=${JSON.stringify(attempts)}`);
      throw new Error(`Analysis failed after fallback: ${message}`);
    }

    // Persist to database via admin client so the row is always recorded
    // (otherwise a silent RLS failure would let free users bypass the monthly limit).
    const { data: saved, error } = await supabaseAdmin
      .from("analyses")
      .insert({
        user_id: userId,
        resume_filename: data.resumeFilename ?? null,
        resume_text: data.resumeText,
        job_description: data.jobDescription,
        match_score: result.matchScore,
        summary: result.summary,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        missing_keywords: result.missingKeywords,
        optimized_resume: result.optimizedResume,
        cover_letter: result.coverLetter,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to save analysis:", error);
      throw new Error(`Failed to save analysis: ${error.message}`);
    }
    return { ...result, id: saved?.id ?? null, plan };
  });

export const listAnalyses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("analyses")
      .select("id, resume_filename, match_score, summary, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("analyses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getAnalysis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("analyses")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", userId)
      .single();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Analysis not found.");
    return row as Tables<"analyses">;
  });

// ─── Queued analysis ────────────────────────────────────────────────────────

const EnqueueSchema = InputSchema.extend({
  resumeStoragePath: z.string().max(500).optional(),
});

export const enqueueAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => EnqueueSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const admin = await isAdminUser(supabase as never, userId);
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, plan_tier, pro_started_at, pro_expires_at")
      .eq("id", userId)
      .maybeSingle();
    const status = resolvePlanStatus(profile as PlanRow | null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!admin) {
      if (status.proExpired) {
        throw new Error("Your Pro subscription has expired. Please renew to continue running analyses.");
      }
      const limit = getMonthlyLimit(status.effectiveTier);
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
          if (status.effectiveTier === "free") {
            throw new Error("Free plan limit reached: 1 CV analysis per month. Upgrade to Pro for more analyses.");
          }
          throw new Error(`Monthly limit reached (${limit} analyses). Upgrade to a higher plan for more capacity.`);
        }
      }
    }

    const { data: job, error } = await supabaseAdmin
      .from("analysis_jobs")
      .insert({
        user_id: userId,
        status: "pending",
        resume_text: data.resumeText,
        job_description: data.jobDescription,
        resume_filename: data.resumeFilename ?? null,
        resume_storage_path: data.resumeStoragePath ?? null,
      })
      .select("id")
      .single();
    if (error || !job) throw new Error(error?.message ?? "Failed to enqueue analysis");

    // Kick off processing in the same request. The job row is the source of
    // truth — if the worker dies mid-run, the cron safety-net retries.
    const { runAnalysisJob } = await import("./analyze-runner.server");
    runAnalysisJob(job.id).catch((e) => console.error("[enqueueAnalysis] runner error", e));

    return { jobId: job.id as string };
  });

export const getAnalysisJob = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ jobId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("analysis_jobs")
      .select("id, status, analysis_id, error, created_at")
      .eq("id", data.jobId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Job not found.");
    return row;
  });

export const retryAnalysisJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ jobId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify ownership and that the job is actually failed
    const { data: job, error: fetchErr } = await supabase
      .from("analysis_jobs")
      .select("id, status, resume_text, job_description, resume_filename, resume_storage_path")
      .eq("id", data.jobId)
      .eq("user_id", userId)
      .single();
    if (fetchErr || !job) throw new Error("Job not found.");
    if (job.status !== "failed") throw new Error("Only failed jobs can be retried.");

    // Re-check plan/quota since time may have passed
    const admin = await isAdminUser(supabase as never, userId);
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, plan_tier, pro_started_at, pro_expires_at")
      .eq("id", userId)
      .maybeSingle();
    const status = resolvePlanStatus(profile as PlanRow | null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!admin) {
      if (status.proExpired) {
        throw new Error("Your Pro subscription has expired. Please renew to continue running analyses.");
      }
      const limit = getMonthlyLimit(status.effectiveTier);
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
          if (status.effectiveTier === "free") {
            throw new Error("Free plan limit reached: 1 CV analysis per month. Upgrade to Pro for more analyses.");
          }
          throw new Error(`Monthly limit reached (${limit} analyses). Upgrade to a higher plan for more capacity.`);
        }
      }
    }

    // Reset job to pending (clear error, reset attempts)
    const { error: updateErr } = await supabaseAdmin
      .from("analysis_jobs")
      .update({
        status: "pending",
        error: null,
        attempts: 0,
        started_at: null,
        completed_at: null,
        analysis_id: null,
      })
      .eq("id", data.jobId);
    if (updateErr) throw new Error(updateErr.message);

    // Kick off runner immediately
    const { runAnalysisJob } = await import("./analyze-runner.server");
    runAnalysisJob(data.jobId).catch((e) => console.error("[retryAnalysisJob] runner error", e));

    return { jobId: data.jobId };
  });

export const listAnalysisJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("analysis_jobs")
      .select("id, status, error, resume_filename, created_at, analysis_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getResumeDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ analysisId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("analyses")
      .select("resume_storage_path, user_id")
      .eq("id", data.analysisId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!row?.resume_storage_path) throw new Error("Original file not available for this analysis.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("resumes")
      .createSignedUrl(row.resume_storage_path, 60);
    if (error || !signed) throw new Error(error?.message ?? "Could not sign URL");
    return { url: signed.signedUrl };
  });

