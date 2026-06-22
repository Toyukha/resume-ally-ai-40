import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PLAN_LIMITS, isUnlimited } from "./plan";
import type { Database } from "@/integrations/supabase/types";

type EmployerJobStatus = Database["public"]["Enums"]["employer_job_status"];

const JobSchema = z.object({
  companyId: z.string().uuid(),
  title: z.string().trim().min(2).max(200),
  department: z.string().trim().max(120).optional(),
  employmentType: z.enum(["full_time", "part_time", "contract", "internship", "temporary"]).default("full_time"),
  workMode: z.enum(["remote", "hybrid", "onsite"]).default("onsite"),
  location: z.string().trim().max(200).optional(),
  salaryMin: z.number().int().min(0).max(10_000_000).optional(),
  salaryMax: z.number().int().min(0).max(10_000_000).optional(),
  currency: z.string().trim().min(3).max(3).default("USD"),
  description: z.string().trim().min(20).max(20_000),
  responsibilities: z.string().trim().max(10_000).optional(),
  requiredSkills: z.array(z.string().trim().max(60)).max(40).default([]),
  preferredSkills: z.array(z.string().trim().max(60)).max(40).default([]),
  experienceLevel: z.string().trim().max(80).optional(),
  education: z.string().trim().max(120).optional(),
  vacancies: z.number().int().min(1).max(999).default(1),
  deadline: z.string().date().optional(),
  applyMode: z.enum(["in_app", "external"]).default("in_app"),
  externalUrl: z.string().url().max(500).optional(),
});

async function assertCanManage(supabase: any, companyId: string, userId: string) {
  const { data, error } = await supabase.rpc("can_manage_jobs", { _company: companyId, _user: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("You don't have permission to manage jobs in this company.");
}

async function enforceActiveJobCap(supabase: any, companyId: string) {
  const { data: company } = await supabase.from("companies").select("plan").eq("id", companyId).maybeSingle();
  const plan = (company?.plan ?? "starter") as keyof typeof PLAN_LIMITS;
  const cap = PLAN_LIMITS[plan].activeJobs;
  if (isUnlimited(cap)) return;
  const { count } = await supabase
    .from("employer_jobs")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("status", "active");
  if ((count ?? 0) >= cap) {
    throw new Error(`Your ${PLAN_LIMITS[plan].label} plan allows ${cap} active jobs. Upgrade to publish more.`);
  }
}

export const createJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => JobSchema.extend({ publish: z.boolean().default(false) }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertCanManage(supabase, data.companyId, userId);
    if (data.publish) await enforceActiveJobCap(supabase, data.companyId);
    const status: EmployerJobStatus = data.publish ? "active" : "draft";
    const { data: row, error } = await supabase
      .from("employer_jobs")
      .insert({
        company_id: data.companyId,
        posted_by: userId,
        title: data.title,
        department: data.department ?? null,
        employment_type: data.employmentType,
        work_mode: data.workMode,
        location: data.location ?? null,
        salary_min: data.salaryMin ?? null,
        salary_max: data.salaryMax ?? null,
        currency: data.currency,
        description: data.description,
        responsibilities: data.responsibilities ?? null,
        required_skills: data.requiredSkills,
        preferred_skills: data.preferredSkills,
        experience_level: data.experienceLevel ?? null,
        education: data.education ?? null,
        vacancies: data.vacancies,
        deadline: data.deadline ?? null,
        apply_mode: data.applyMode,
        external_url: data.externalUrl ?? null,
        status,
        published_at: status === "active" ? new Date().toISOString() : null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await supabase.from("recruiter_activity").insert({
      company_id: data.companyId,
      actor_id: userId,
      kind: status === "active" ? "job_published" : "job_drafted",
      entity_type: "employer_job",
      entity_id: row.id,
      payload: { title: data.title },
    });
    return { id: row.id as string };
  });

export const updateJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => JobSchema.extend({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertCanManage(supabase, data.companyId, userId);
    const { error } = await supabase
      .from("employer_jobs")
      .update({
        title: data.title,
        department: data.department ?? null,
        employment_type: data.employmentType,
        work_mode: data.workMode,
        location: data.location ?? null,
        salary_min: data.salaryMin ?? null,
        salary_max: data.salaryMax ?? null,
        currency: data.currency,
        description: data.description,
        responsibilities: data.responsibilities ?? null,
        required_skills: data.requiredSkills,
        preferred_skills: data.preferredSkills,
        experience_level: data.experienceLevel ?? null,
        education: data.education ?? null,
        vacancies: data.vacancies,
        deadline: data.deadline ?? null,
        apply_mode: data.applyMode,
        external_url: data.externalUrl ?? null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setJobStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    id: z.string().uuid(),
    status: z.enum(["draft", "active", "closed", "archived"]),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: job, error: je } = await supabase.from("employer_jobs").select("company_id, status").eq("id", data.id).maybeSingle();
    if (je || !job) throw new Error(je?.message ?? "Job not found");
    await assertCanManage(supabase, job.company_id, userId);
    if (data.status === "active" && job.status !== "active") {
      await enforceActiveJobCap(supabase, job.company_id);
    }
    const patch = {
      status: data.status,
      ...(data.status === "active" && job.status !== "active"
        ? { published_at: new Date().toISOString() }
        : {}),
    };
    const { error } = await supabase.from("employer_jobs").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    await supabase.from("recruiter_activity").insert({
      company_id: job.company_id,
      actor_id: userId,
      kind: `job_${data.status}`,
      entity_type: "employer_job",
      entity_id: data.id,
      payload: {},
    });
    return { ok: true };
  });

export const deleteJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: job } = await supabase.from("employer_jobs").select("company_id").eq("id", data.id).maybeSingle();
    if (!job) throw new Error("Not found");
    await assertCanManage(supabase, job.company_id, userId);
    const { error } = await supabase.from("employer_jobs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const duplicateJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: src, error } = await supabase.from("employer_jobs").select("*").eq("id", data.id).maybeSingle();
    if (error || !src) throw new Error("Not found");
    await assertCanManage(supabase, src.company_id, userId);
    const { data: row, error: ie } = await supabase
      .from("employer_jobs")
      .insert({
        company_id: src.company_id,
        posted_by: userId,
        title: `${src.title} (copy)`,
        department: src.department,
        employment_type: src.employment_type,
        work_mode: src.work_mode,
        location: src.location,
        salary_min: src.salary_min,
        salary_max: src.salary_max,
        currency: src.currency,
        description: src.description,
        responsibilities: src.responsibilities,
        required_skills: src.required_skills,
        preferred_skills: src.preferred_skills,
        experience_level: src.experience_level,
        education: src.education,
        vacancies: src.vacancies,
        deadline: src.deadline,
        apply_mode: src.apply_mode,
        external_url: src.external_url,
        status: "draft",
      })
      .select("id")
      .single();
    if (ie) throw new Error(ie.message);
    return { id: row.id as string };
  });

export const listCompanyJobs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    companyId: z.string().uuid(),
    status: z.enum(["all", "draft", "active", "closed", "archived"]).default("all"),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let q = supabase
      .from("employer_jobs")
      .select("id, title, status, work_mode, employment_type, location, application_count, created_at, published_at, deadline, apply_mode")
      .eq("company_id", data.companyId)
      .order("created_at", { ascending: false });
    if (data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getJobForEdit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase.from("employer_jobs").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Job not found");
    return row;
  });
