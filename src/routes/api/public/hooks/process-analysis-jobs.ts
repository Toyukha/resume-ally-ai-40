// Cron-driven worker that processes pending analysis jobs.
// Auth: requires CRON_SECRET in the `x-cron-secret` header (timing-safe compare).
// Per-request safety: only processes one job per call.

import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "crypto";
import { runAnalysisJob } from "@/lib/analyze-runner.server";

const MAX_RETRIES = 3;

function authorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET ?? "";
  const provided = request.headers.get("x-cron-secret") ?? "";
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const Route = createFileRoute("/api/public/hooks/process-analysis-jobs")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!authorized(request)) return new Response("Unauthorized", { status: 401 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const stuckCutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data: jobs } = await supabaseAdmin
          .from("analysis_jobs")
          .select("id, status, attempts, started_at")
          .or(`status.eq.pending,and(status.eq.processing,started_at.lt.${stuckCutoff})`)
          .lt("attempts", MAX_RETRIES)
          .order("created_at", { ascending: true })
          .limit(1);

        const job = jobs?.[0];
        if (!job) return Response.json({ ok: true, processed: 0 });

        if (job.status === "processing") {
          await supabaseAdmin
            .from("analysis_jobs")
            .update({ status: "pending" })
            .eq("id", job.id)
            .eq("status", "processing");
        }

        const result = await runAnalysisJob(job.id);
        return Response.json({ ok: true, processed: 1, jobId: job.id, result });
      },
    },
  },
});
