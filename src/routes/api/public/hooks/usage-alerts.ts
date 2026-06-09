// Daily capacity / usage alert job. Reads a snapshot and writes a
// `system_notifications` row when DB size or failed-job count crosses
// thresholds. Super-admins already see those notifications in-app.

import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "crypto";

const DB_SIZE_WARN_BYTES = 400 * 1024 * 1024; // 400 MB ~ 80% of 500 MB free tier
const FAILED_JOBS_WARN = 10;

function authorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET ?? "";
  const provided = request.headers.get("x-cron-secret") ?? "";
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const Route = createFileRoute("/api/public/hooks/usage-alerts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!authorized(request)) return new Response("Unauthorized", { status: 401 });


        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: snap, error } = await supabaseAdmin.rpc("get_capacity_snapshot");
        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

        const s = snap as {
          db_size_bytes: number;
          analyses_total: number;
          analyses_this_month: number;
          jobs_pending: number;
          jobs_failed_24h: number;
          active_pro: number;
          users_total: number;
        };

        const warnings: { title: string; message: string; severity: string }[] = [];
        if (s.db_size_bytes >= DB_SIZE_WARN_BYTES) {
          warnings.push({
            severity: "warning",
            title: "Database approaching capacity",
            message: `Database is using ${(s.db_size_bytes / 1024 / 1024).toFixed(1)} MB (≥80% of free tier). Consider upgrading the database server or trimming old analyses.`,
          });
        }
        if (s.jobs_failed_24h >= FAILED_JOBS_WARN) {
          warnings.push({
            severity: "warning",
            title: "Elevated analysis failure rate",
            message: `${s.jobs_failed_24h} analysis jobs failed in the last 24 hours. Check the AI gateway logs.`,
          });
        }

        if (warnings.length > 0) {
          const rows = warnings.map((w) => ({
            type: "capacity_warning",
            severity: w.severity,
            title: w.title,
            message: w.message,
            metadata: s as unknown as never,
          }));
          await supabaseAdmin.from("system_notifications").insert(rows);
        }

        return Response.json({ ok: true, snapshot: s, alerts: warnings.length });
      },
    },
  },
});
