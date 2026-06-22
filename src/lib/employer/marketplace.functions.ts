// Public-read helper to surface employer jobs in the marketplace.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const listPublicEmployerJobs = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({
    query: z.string().max(200).optional(),
    limit: z.number().int().min(1).max(50).default(20),
  }).parse(i ?? {}))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    let q = supabase
      .from("employer_jobs")
      .select("id, title, location, work_mode, employment_type, salary_min, salary_max, currency, published_at, required_skills, apply_mode, external_url, companies(name, logo_url, slug)")
      .eq("status", "active")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(data.limit);
    if (data.query) q = q.ilike("title", `%${data.query}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getPublicEmployerJob = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: row, error } = await supabase
      .from("employer_jobs")
      .select("*, companies(name, logo_url, slug, description, website, industry)")
      .eq("id", data.id)
      .eq("status", "active")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Job not found");
    return row;
  });
