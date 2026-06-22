import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getDashboardSnapshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ companyId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * 86400_000).toISOString().slice(0, 10);

    const [
      { count: activeJobs },
      { count: totalApplicants },
      { count: interviewsScheduled },
      { count: hired },
      { count: expiringSoon },
      { data: topMatches },
      { data: activity },
    ] = await Promise.all([
      supabase.from("employer_jobs").select("id", { count: "exact", head: true }).eq("company_id", data.companyId).eq("status", "active"),
      supabase.from("employer_applications").select("id, employer_jobs!inner(company_id)", { count: "exact", head: true }).eq("employer_jobs.company_id", data.companyId),
      supabase.from("interviews").select("id, employer_applications!inner(employer_jobs!inner(company_id))", { count: "exact", head: true }).eq("status", "scheduled").eq("employer_applications.employer_jobs.company_id", data.companyId),
      supabase.from("employer_applications").select("id, employer_jobs!inner(company_id)", { count: "exact", head: true }).eq("stage", "hired").eq("employer_jobs.company_id", data.companyId),
      supabase.from("employer_jobs").select("id", { count: "exact", head: true }).eq("company_id", data.companyId).eq("status", "active").not("deadline", "is", null).lte("deadline", in7),
      supabase
        .from("candidate_scores")
        .select("ats_score, summary, application:employer_applications!inner(id, candidate_name, employer_jobs!inner(title, company_id))")
        .eq("application.employer_jobs.company_id", data.companyId)
        .order("ats_score", { ascending: false })
        .limit(5),
      supabase
        .from("recruiter_activity")
        .select("id, kind, payload, created_at")
        .eq("company_id", data.companyId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    // Average ATS via a focused select to keep simple
    const { data: scoreRows } = await supabase
      .from("candidate_scores")
      .select("ats_score, application:employer_applications!inner(employer_jobs!inner(company_id))")
      .eq("application.employer_jobs.company_id", data.companyId);
    const scores = (scoreRows ?? []).map((r: any) => r.ats_score as number).filter((n) => typeof n === "number");
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    return {
      kpis: {
        activeJobs: activeJobs ?? 0,
        totalApplicants: totalApplicants ?? 0,
        interviewsScheduled: interviewsScheduled ?? 0,
        hired: hired ?? 0,
        expiringSoon: expiringSoon ?? 0,
        averageAtsScore: avgScore,
      },
      topMatches: (topMatches ?? []).map((r: any) => ({
        applicationId: r.application?.id,
        candidateName: r.application?.candidate_name ?? "Anonymous",
        jobTitle: r.application?.employer_jobs?.title ?? "",
        score: r.ats_score,
        summary: r.summary,
      })),
      activity: activity ?? [],
    };
  });
