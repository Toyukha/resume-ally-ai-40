// Cron-driven worker that processes pending analysis jobs.
// Auth: requires the project anon/publishable key in the `apikey` header
// (matches the pg_cron convention). Per-request safety: only processes one
// job per call to stay well under worker time limits.

import { createFileRoute } from "@tanstack/react-router";
import { runAnalysisJob } from "@/lib/analyze-runner.server";

const MAX_RETRIES = 3;

export const Route = createFileRoute("/api/public/hooks/process-analysis-jobs")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const provided = request.headers.get("apikey") ?? "";
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY ?? "";
        if (!expected || provided !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Pick oldest pending job; also reclaim long-running 'processing' jobs (>5min).
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

        // Reset stuck processing jobs to pending so runAnalysisJob's atomic
        // claim works.
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
