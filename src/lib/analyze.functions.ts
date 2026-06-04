import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { Tables } from "@/integrations/supabase/types";


const InputSchema = z.object({
  resumeText: z.string().min(50, "Resume text is too short").max(50000),
  jobDescription: z.string().min(30, "Job description is too short").max(20000),
  resumeFilename: z.string().max(255).optional(),
});

export const AnalysisSchema = z.object({
  matchScore: z.number().min(0).max(100),
  summary: z.string(),
  strengths: z.array(z.string()).min(1).max(10),
  weaknesses: z.array(z.string()).min(1).max(10),
  missingKeywords: z.array(z.string()).max(25),
  optimizedResume: z.string(),
  coverLetter: z.string(),
});

const FreeAnalysisSchema = z.object({
  matchScore: z.number().min(0).max(100),
  summary: z.string(),
  strengths: z.array(z.string()).min(1).max(10),
  weaknesses: z.array(z.string()).min(1).max(10),
});

export type AnalysisResult = z.infer<typeof AnalysisSchema> & { plan?: "free" | "pro" };

const LOCKED_MESSAGE = "🔒 Upgrade to Pro to unlock optimized resume generation and tailored cover letters.";

type PlanRow = { plan: string | null; pro_started_at: string | null; pro_expires_at: string | null };

function resolvePlanStatus(profile: PlanRow | null) {
  const rawPlan = (profile?.plan ?? "free") as "free" | "pro";
  const expiresAt = profile?.pro_expires_at ? new Date(profile.pro_expires_at) : null;
  const proActive = rawPlan === "pro" && expiresAt !== null && expiresAt.getTime() > Date.now();
  const proExpired = rawPlan === "pro" && !proActive;
  const effectivePlan: "free" | "pro" = proActive ? "pro" : "free";
  return { rawPlan, effectivePlan, proActive, proExpired, expiresAt, startedAt: profile?.pro_started_at ?? null };
}


async function isAdminUser(supabase: { from: (t: string) => { select: (c: string) => { eq: (col: string, v: string) => { eq: (col: string, v: boolean) => { limit: (n: number) => { maybeSingle: () => Promise<{ data: unknown }> } } } } } }, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("suspended", false)
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
      .select("plan, pro_started_at, pro_expires_at")
      .eq("id", userId)
      .maybeSingle();
    const status = resolvePlanStatus(data as PlanRow | null);

    // Count this month's analyses (calendar-month reset for free users)
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("analyses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", monthStart.toISOString());

    return {
      plan: admin ? ("pro" as const) : status.effectivePlan,
      rawPlan: status.rawPlan,
      isAdmin: admin,
      proExpired: admin ? false : status.proExpired,
      proExpiresAt: status.expiresAt?.toISOString() ?? null,
      proStartedAt: status.startedAt,
      analysesThisMonth: count ?? 0,
      monthlyLimit: admin ? null : (status.effectivePlan === "free" ? 1 : null),
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
      .select("plan, pro_started_at, pro_expires_at")
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

      // Enforce free-tier monthly limit (resets at the start of each calendar month)
      // Use admin client so the gate is not affected by RLS visibility quirks.
      if (status.effectivePlan === "free") {
        const monthStart = new Date();
        monthStart.setUTCDate(1);
        monthStart.setUTCHours(0, 0, 0, 0);
        const { count, error: countError } = await supabaseAdmin
          .from("analyses")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", monthStart.toISOString());
        if (countError) throw new Error(`Unable to verify plan usage: ${countError.message}`);
        if ((count ?? 0) >= 1) {
          throw new Error("Free plan limit reached: 1 CV analysis per month. Upgrade to Pro for unlimited analyses.");
        }
      }
    }

    const plan: "free" | "pro" = admin ? "pro" : status.effectivePlan;

    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway("google/gemini-3-flash-preview");

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

    let result: z.infer<typeof AnalysisSchema>;
    try {
      const { experimental_output } = await generateText({
        model,
        system,
        prompt,
        experimental_output: Output.object({ schema: isFree ? FreeAnalysisSchema : AnalysisSchema }),
      });
      if (isFree) {
        const free = experimental_output as z.infer<typeof FreeAnalysisSchema>;
        result = {
          ...free,
          missingKeywords: [],
          optimizedResume: LOCKED_MESSAGE,
          coverLetter: LOCKED_MESSAGE,
        };
      } else {
        result = experimental_output as z.infer<typeof AnalysisSchema>;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("429")) throw new Error("Rate limit reached. Please wait a moment and try again.");
      if (message.includes("402")) throw new Error("AI credits exhausted. Please add credits in workspace billing.");
      throw new Error(`Analysis failed: ${message}`);
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
