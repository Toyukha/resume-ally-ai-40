import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

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

export type AnalysisResult = z.infer<typeof AnalysisSchema>;

export const analyzeResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI service is not configured.");

    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway("google/gemini-3-flash-preview");

    const system = `You are an elite resume optimization assistant. Analyze the candidate's resume against the target job description.
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

    let result: AnalysisResult;
    try {
      const { experimental_output } = await generateText({
        model,
        system,
        prompt,
        experimental_output: Output.object({ schema: AnalysisSchema }),
      });
      result = experimental_output;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("429")) throw new Error("Rate limit reached. Please wait a moment and try again.");
      if (message.includes("402")) throw new Error("AI credits exhausted. Please add credits in workspace billing.");
      throw new Error(`Analysis failed: ${message}`);
    }

    // Persist to database
    const { supabase, userId } = context;
    const { data: saved, error } = await supabase
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

    if (error) console.error("Failed to save analysis:", error);
    return { ...result, id: saved?.id ?? null };
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
