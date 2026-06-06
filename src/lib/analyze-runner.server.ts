// Server-only AI analysis runner. Invoked by enqueueAnalysis and the
// process-analysis-jobs worker route. Picks up an analysis_jobs row, runs the
// AI pipeline, writes the analyses row, and marks the job completed/failed.

import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { AnalysisSchema } from "./analyze.functions";

const FreeAnalysisSchema = z.object({
  matchScore: z.number().min(0).max(100),
  summary: z.string(),
  strengths: z.array(z.string()).max(10),
  weaknesses: z.array(z.string()).max(10),
});

const LOCKED_MESSAGE = "🔒 Upgrade to Pro to unlock optimized resume generation and tailored cover letters.";

type RunOk = { ok: true; analysisId: string };
type RunErr = { ok: false; error: string };

async function isAdminUser(userId: string) {
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

export async function runAnalysisJob(jobId: string): Promise<RunOk | RunErr> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return { ok: false, error: "AI service is not configured." };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Atomic claim: only proceed if still pending
  const { data: claimed, error: claimErr } = await supabaseAdmin
    .from("analysis_jobs")
    .update({ status: "processing", started_at: new Date().toISOString(), attempts: 1 })
    .eq("id", jobId)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();
  if (claimErr || !claimed) return { ok: false, error: claimErr?.message ?? "Job already claimed" };

  const userId = claimed.user_id as string;
  const resumeText = claimed.resume_text as string;
  const jobDescription = claimed.job_description as string;
  const resumeFilename = (claimed.resume_filename as string | null) ?? null;
  const resumeStoragePath = (claimed.resume_storage_path as string | null) ?? null;

  try {
    const admin = await isAdminUser(userId);
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("plan, pro_expires_at")
      .eq("id", userId)
      .maybeSingle();
    const proActive = profile?.plan === "pro"
      && !!profile.pro_expires_at
      && new Date(profile.pro_expires_at).getTime() > Date.now();
    const isFree = !admin && !proActive;

    const gateway = createLovableAiGatewayProvider(apiKey);
    const PRIMARY_MODEL = "google/gemini-2.5-flash";
    const FALLBACK_MODEL = "google/gemini-2.5-pro";
    const schema = isFree ? FreeAnalysisSchema : AnalysisSchema;

    const system = isFree
      ? `You are a resume analysis assistant. Analyze the candidate's resume against the target job description and return:
- matchScore: 0-100 numeric fit score
- summary: 2 short sentences explaining the score
- strengths: 3-6 concrete bullet phrases
- weaknesses: 3-6 concrete gaps the candidate should address
Tone: confident, specific, ATS-friendly.`
      : `You are an elite resume optimization assistant. Analyze the candidate's resume against the target job description.
Return a JSON object with:
- matchScore, summary, strengths, weaknesses
- missingKeywords: 5-15 ATS-relevant keywords missing from the resume
- optimizedResume: clean Markdown with Summary, Experience, Skills, Education
- coverLetter: 3-paragraph professional cover letter (~250 words)

Never invent employers, degrees, or dates.`;

    const prompt = `RESUME:\n"""\n${resumeText}\n"""\n\nJOB DESCRIPTION:\n"""\n${jobDescription}\n"""`;

    let result: z.infer<typeof AnalysisSchema> | null = null;
    let lastError: unknown = null;
    const isSchemaMismatch = (msg: string) =>
      /did not match schema|No object generated|validation|invalid_type|Expected/i.test(msg);

    for (const modelId of [PRIMARY_MODEL, FALLBACK_MODEL]) {
      try {
        const gen = await generateText({
          model: gateway(modelId),
          system,
          prompt,
          experimental_output: Output.object({ schema }),
        });
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
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        lastError = err;
        if (message.includes("429") || message.includes("402")) throw err;
        if (!isSchemaMismatch(message)) throw err;
      }
    }

    if (!result) throw lastError ?? new Error("Analysis failed");

    const { data: saved, error: insertErr } = await supabaseAdmin
      .from("analyses")
      .insert({
        user_id: userId,
        resume_filename: resumeFilename,
        resume_storage_path: resumeStoragePath,
        resume_text: resumeText,
        job_description: jobDescription,
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
    if (insertErr || !saved) throw new Error(insertErr?.message ?? "Failed to persist analysis");

    await supabaseAdmin
      .from("analysis_jobs")
      .update({
        status: "completed",
        analysis_id: saved.id,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    return { ok: true, analysisId: saved.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[runAnalysisJob] job=${jobId} failed:`, message);
    await supabaseAdmin
      .from("analysis_jobs")
      .update({
        status: "failed",
        error: message.slice(0, 1000),
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);
    return { ok: false, error: message };
  }
}
