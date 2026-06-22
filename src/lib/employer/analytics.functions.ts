import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ companyId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [{ data: apps }, { data: jobs }, { data: scores }] = await Promise.all([
      supabase
        .from("employer_applications")
        .select("id, stage, applied_at, hired_at, source, job_id, employer_jobs!inner(title, company_id)")
        .eq("employer_jobs.company_id", data.companyId),
      supabase.from("employer_jobs").select("id, title").eq("company_id", data.companyId),
      supabase
        .from("candidate_scores")
        .select("ats_score, application:employer_applications!inner(employer_jobs!inner(company_id))")
        .eq("application.employer_jobs.company_id", data.companyId),
    ]);
    const allApps = apps ?? [];
    const total = allApps.length;
    const perJob: Record<string, { jobId: string; title: string; count: number }> = {};
    (jobs ?? []).forEach((j) => { perJob[j.id] = { jobId: j.id, title: j.title, count: 0 }; });
    const sources: Record<string, number> = {};
    let timeToHireDays = 0;
    let hiredCount = 0;
    const funnel: Record<string, number> = {
      applied: 0, under_review: 0, shortlisted: 0, interview_scheduled: 0,
      assessment: 0, final_review: 0, offer_sent: 0, hired: 0, rejected: 0,
    };
    for (const a of allApps) {
      const jId = a.job_id as string;
      if (perJob[jId]) perJob[jId].count += 1;
      const src = (a.source as string | null) ?? "in_app";
      sources[src] = (sources[src] ?? 0) + 1;
      const stage = a.stage as keyof typeof funnel;
      if (funnel[stage] !== undefined) funnel[stage] += 1;
      if (a.hired_at && a.applied_at) {
        const d = (new Date(a.hired_at).getTime() - new Date(a.applied_at).getTime()) / 86400_000;
        timeToHireDays += d;
        hiredCount += 1;
      }
    }
    const allScores = (scores ?? []).map((r: any) => r.ats_score as number).filter((n) => typeof n === "number");
    const avgScore = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;
    return {
      total,
      avgScore,
      averageTimeToHire: hiredCount ? Math.round((timeToHireDays / hiredCount) * 10) / 10 : null,
      sources: Object.entries(sources).map(([source, count]) => ({ source, count })),
      perJob: Object.values(perJob).sort((a, b) => b.count - a.count).slice(0, 10),
      funnel: Object.entries(funnel).map(([stage, count]) => ({ stage, count })),
    };
  });
