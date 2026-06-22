import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ApplySchema = z.object({
  jobId: z.string().uuid(),
  resumeText: z.string().trim().min(50).max(50_000),
  coverLetter: z.string().trim().max(20_000).optional(),
  resumeFilePath: z.string().max(500).optional(),
  candidateName: z.string().trim().max(120).optional(),
});

export const submitApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ApplySchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    // Verify job is active
    const { data: job, error: je } = await supabase
      .from("employer_jobs")
      .select("id, status, company_id, title, description, required_skills, preferred_skills, experience_level, education, apply_mode")
      .eq("id", data.jobId)
      .maybeSingle();
    if (je || !job) throw new Error("Job not found");
    if (job.status !== "active") throw new Error("This job is no longer accepting applications.");
    if (job.apply_mode === "external") throw new Error("This role uses an external apply link.");

    const email = (claims?.email as string | undefined) ?? null;
    const { data: row, error } = await supabase
      .from("employer_applications")
      .insert({
        job_id: data.jobId,
        candidate_user_id: userId,
        candidate_name: data.candidateName ?? null,
        candidate_email: email,
        resume_text: data.resumeText,
        resume_file_path: data.resumeFilePath ?? null,
        cover_letter: data.coverLetter ?? null,
        source: "in_app",
      })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") throw new Error("You've already applied to this job.");
      throw new Error(error.message);
    }
    await supabase.from("recruiter_activity").insert({
      company_id: job.company_id,
      actor_id: userId,
      kind: "application_received",
      entity_type: "application",
      entity_id: row.id,
      payload: { jobTitle: job.title },
    });
    // Fire-and-forget ATS scoring (await briefly so user sees a score on next view)
    try {
      const { scoreCandidate } = await import("./ats.server");
      const score = await scoreCandidate({
        jobTitle: job.title,
        jobDescription: job.description,
        requiredSkills: job.required_skills ?? [],
        preferredSkills: job.preferred_skills ?? [],
        experienceLevel: job.experience_level,
        education: job.education,
        resumeText: data.resumeText,
        coverLetter: data.coverLetter ?? null,
      });
      await supabase.from("candidate_scores").upsert({
        application_id: row.id,
        ats_score: score.atsScore,
        skills_match_pct: score.skillsMatchPct,
        experience_match_pct: score.experienceMatchPct,
        education_match_pct: score.educationMatchPct,
        keyword_match_pct: score.keywordMatchPct,
        strengths: score.strengths,
        gaps: score.gaps,
        missing_keywords: score.missingKeywords,
        summary: score.summary,
        model: "google/gemini-3-flash-preview",
      });
    } catch (e) {
      console.error("[ats] scoring failed", e);
    }
    return { id: row.id as string };
  });

export const listJobApplications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ jobId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("employer_applications")
      .select("id, candidate_name, candidate_email, stage, applied_at, last_stage_change_at, candidate_scores(ats_score, skills_match_pct, summary)")
      .eq("job_id", data.jobId)
      .order("applied_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const updateApplicationStage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    id: z.string().uuid(),
    stage: z.enum(["applied","under_review","shortlisted","interview_scheduled","assessment","final_review","offer_sent","hired","rejected"]),
    rejectedReason: z.string().trim().max(500).optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const patch = {
      stage: data.stage,
      ...(data.stage === "rejected" && data.rejectedReason ? { rejected_reason: data.rejectedReason } : {}),
    };
    const { data: row, error } = await supabase
      .from("employer_applications")
      .update(patch)
      .eq("id", data.id)
      .select("id, job_id, employer_jobs(company_id, title)")
      .single();
    if (error) throw new Error(error.message);
    const job = (row as any).employer_jobs;
    if (job?.company_id) {
      await supabase.from("recruiter_activity").insert({
        company_id: job.company_id,
        actor_id: userId,
        kind: `application_${data.stage}`,
        entity_type: "application",
        entity_id: data.id,
        payload: { jobTitle: job.title },
      });
    }
    return { ok: true };
  });

export const getApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("employer_applications")
      .select(`
        id, candidate_name, candidate_email, resume_text, cover_letter, stage, applied_at, last_stage_change_at, rejected_reason,
        job:employer_jobs(id, title, company_id, location, work_mode, required_skills, preferred_skills),
        score:candidate_scores(*)
      `)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Application not found");
    return row;
  });

export const rescoreApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: app, error } = await supabase
      .from("employer_applications")
      .select("id, resume_text, cover_letter, employer_jobs(title, description, required_skills, preferred_skills, experience_level, education)")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !app) throw new Error("Application not found");
    const job = (app as any).employer_jobs;
    const { scoreCandidate } = await import("./ats.server");
    const s = await scoreCandidate({
      jobTitle: job.title,
      jobDescription: job.description,
      requiredSkills: job.required_skills ?? [],
      preferredSkills: job.preferred_skills ?? [],
      experienceLevel: job.experience_level,
      education: job.education,
      resumeText: app.resume_text ?? "",
      coverLetter: app.cover_letter,
    });
    await supabase.from("candidate_scores").upsert({
      application_id: app.id,
      ats_score: s.atsScore,
      skills_match_pct: s.skillsMatchPct,
      experience_match_pct: s.experienceMatchPct,
      education_match_pct: s.educationMatchPct,
      keyword_match_pct: s.keywordMatchPct,
      strengths: s.strengths,
      gaps: s.gaps,
      missing_keywords: s.missingKeywords,
      summary: s.summary,
      model: "google/gemini-3-flash-preview",
    });
    return { ok: true };
  });
