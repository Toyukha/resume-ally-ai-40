import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const InputSchema = z.object({
  resumeText: z.string().min(50, "Resume text is too short").max(50000),
  jobDescription: z.string().min(30, "Job description is too short").max(20000),
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
  .handler(async ({ data }) => {
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

    try {
      const { experimental_output } = await generateText({
        model,
        system,
        prompt,
        experimental_output: Output.object({ schema: AnalysisSchema }),
      });
      return experimental_output;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("429")) throw new Error("Rate limit reached. Please wait a moment and try again.");
      if (message.includes("402")) throw new Error("AI credits exhausted. Please add credits in workspace billing.");
      throw new Error(`Analysis failed: ${message}`);
    }
  });
