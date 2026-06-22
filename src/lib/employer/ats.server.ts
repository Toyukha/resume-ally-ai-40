// Server-only ATS scoring helper. Never import from client modules.
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "../ai-gateway.server";

const ScoreSchema = z.object({
  atsScore: z.number().int().min(0).max(100),
  skillsMatchPct: z.number().int().min(0).max(100),
  experienceMatchPct: z.number().int().min(0).max(100),
  educationMatchPct: z.number().int().min(0).max(100),
  keywordMatchPct: z.number().int().min(0).max(100),
  strengths: z.array(z.string()).max(8),
  gaps: z.array(z.string()).max(8),
  missingKeywords: z.array(z.string()).max(20),
  summary: z.string().max(800),
});

export type AtsScore = z.infer<typeof ScoreSchema>;

export async function scoreCandidate(input: {
  jobTitle: string;
  jobDescription: string;
  requiredSkills: string[];
  preferredSkills: string[];
  experienceLevel?: string | null;
  education?: string | null;
  resumeText: string;
  coverLetter?: string | null;
}): Promise<AtsScore> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const gateway = createLovableAiGatewayProvider(key);
  const prompt = `You are an expert ATS (Applicant Tracking System) screener. Compare the candidate's resume to the role and produce concrete sub-scores plus actionable strengths and gaps.

ROLE: ${input.jobTitle}
EXPERIENCE LEVEL: ${input.experienceLevel ?? "Not specified"}
EDUCATION REQUIREMENT: ${input.education ?? "Not specified"}
REQUIRED SKILLS: ${input.requiredSkills.join(", ") || "(none listed)"}
PREFERRED SKILLS: ${input.preferredSkills.join(", ") || "(none listed)"}

JOB DESCRIPTION:
${input.jobDescription.slice(0, 6000)}

CANDIDATE RESUME:
${input.resumeText.slice(0, 8000)}

${input.coverLetter ? `COVER LETTER:\n${input.coverLetter.slice(0, 3000)}` : ""}

Score each dimension 0-100 and compute atsScore as a weighted average favoring skills and experience. List 3-6 strengths, 2-5 gaps, and any required-skill keywords missing from the resume. Summary: 1-2 sentences for the recruiter.`;

  const { output } = await generateText({
    model: gateway("google/gemini-3-flash-preview"),
    output: Output.object({ schema: ScoreSchema }),
    prompt,
    temperature: 0.2,
  });
  return output;
}
