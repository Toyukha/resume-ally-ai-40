import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "company";
}

const CreateCompanySchema = z.object({
  name: z.string().trim().min(2).max(120),
  industry: z.string().trim().max(80).optional(),
  website: z.string().trim().max(300).optional(),
  size: z.string().trim().max(40).optional(),
  hqLocation: z.string().trim().max(120).optional(),
  contactEmail: z.string().trim().email().max(200).optional(),
  description: z.string().trim().max(4000).optional(),
  logoUrl: z.string().trim().max(500).optional(),
});

export const createCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CreateCompanySchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const baseSlug = slugify(data.name);
    let slug = baseSlug;
    for (let attempt = 0; attempt < 6; attempt++) {
      const { data: row, error } = await supabase
        .from("companies")
        .insert({
          name: data.name,
          slug,
          industry: data.industry ?? null,
          website: data.website ?? null,
          size: data.size ?? null,
          hq_location: data.hqLocation ?? null,
          contact_email: data.contactEmail ?? null,
          description: data.description ?? null,
          logo_url: data.logoUrl ?? null,
          created_by: userId,
        })
        .select("id, slug")
        .single();
      if (!error && row) {
        await supabase.from("company_members").insert({
          company_id: row.id,
          user_id: userId,
          role: "admin",
          status: "active",
        });
        return { id: row.id, slug: row.slug };
      }
      if (error?.code === "23505") {
        slug = `${baseSlug}-${Math.floor(Math.random() * 9999)}`;
        continue;
      }
      throw new Error(error?.message ?? "Failed to create company");
    }
    throw new Error("Could not allocate unique company slug");
  });

export const updateCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    CreateCompanySchema.extend({ id: z.string().uuid() }).partial({ name: true }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const patch = {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.industry !== undefined ? { industry: data.industry ?? null } : {}),
      ...(data.website !== undefined ? { website: data.website ?? null } : {}),
      ...(data.size !== undefined ? { size: data.size ?? null } : {}),
      ...(data.hqLocation !== undefined ? { hq_location: data.hqLocation ?? null } : {}),
      ...(data.contactEmail !== undefined ? { contact_email: data.contactEmail ?? null } : {}),
      ...(data.description !== undefined ? { description: data.description ?? null } : {}),
      ...(data.logoUrl !== undefined ? { logo_url: data.logoUrl ?? null } : {}),
    };
    const { error } = await supabase.from("companies").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyCompanies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("company_members")
      .select("role, status, company:companies(id, name, slug, logo_url, plan, industry)")
      .eq("user_id", userId)
      .eq("status", "active");
    if (error) throw new Error(error.message);
    return (data ?? [])
      .filter((r) => r.company)
      .map((r) => ({
        role: r.role,
        company: r.company as { id: string; name: string; slug: string; logo_url: string | null; plan: string; industry: string | null },
      }));
  });

export const getCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase.from("companies").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Company not found");
    return row;
  });
