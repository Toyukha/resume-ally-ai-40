import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const scheduleInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    applicationId: z.string().uuid(),
    scheduledFor: z.string().datetime(),
    durationMinutes: z.number().int().min(10).max(480).default(30),
    mode: z.enum(["video", "phone", "onsite"]).default("video"),
    locationOrLink: z.string().max(500).optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("interviews")
      .insert({
        application_id: data.applicationId,
        scheduled_for: data.scheduledFor,
        duration_minutes: data.durationMinutes,
        mode: data.mode,
        location_or_link: data.locationOrLink ?? null,
        created_by: userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    // Auto-update application stage
    await supabase.from("employer_applications").update({ stage: "interview_scheduled" }).eq("id", data.applicationId);
    return { id: row.id as string };
  });

export const setInterviewStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    id: z.string().uuid(),
    status: z.enum(["scheduled", "completed", "passed", "failed", "cancelled"]),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("interviews").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addInterviewNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    interviewId: z.string().uuid(),
    body: z.string().trim().min(1).max(4000),
    rating: z.number().int().min(1).max(5).optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("interview_notes").insert({
      interview_id: data.interviewId,
      author_id: context.userId,
      body: data.body,
      rating: data.rating ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listCompanyInterviews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ companyId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("interviews")
      .select("id, scheduled_for, duration_minutes, mode, status, location_or_link, application:employer_applications!inner(id, candidate_name, employer_jobs!inner(title, company_id))")
      .eq("application.employer_jobs.company_id", data.companyId)
      .order("scheduled_for", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const listApplicationInterviews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ applicationId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("interviews")
      .select("id, scheduled_for, duration_minutes, mode, status, location_or_link, interview_notes(id, body, rating, author_id, created_at)")
      .eq("application_id", data.applicationId)
      .order("scheduled_for", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
