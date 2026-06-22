import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listMembers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ companyId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [{ data: members, error: e1 }, { data: invites, error: e2 }] = await Promise.all([
      supabase.from("company_members").select("id, user_id, role, status, joined_at").eq("company_id", data.companyId),
      supabase.from("company_invites").select("id, email, role, token, expires_at, accepted_at, created_at").eq("company_id", data.companyId).is("accepted_at", null),
    ]);
    if (e1) throw new Error(e1.message);
    if (e2) throw new Error(e2.message);
    return { members: members ?? [], invites: invites ?? [] };
  });

export const inviteMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    companyId: z.string().uuid(),
    email: z.string().email(),
    role: z.enum(["admin", "recruiter", "hiring_manager"]).default("recruiter"),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("company_invites")
      .insert({
        company_id: data.companyId,
        email: data.email.toLowerCase(),
        role: data.role,
        invited_by: userId,
      })
      .select("token")
      .single();
    if (error) throw new Error(error.message);
    return { token: row.token as string };
  });

export const revokeInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("company_invites").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const acceptInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ token: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    const email = (claims?.email as string | undefined)?.toLowerCase();
    const { data: invite, error } = await supabase
      .from("company_invites")
      .select("id, company_id, email, role, expires_at, accepted_at")
      .eq("token", data.token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!invite) throw new Error("Invite not found or already used.");
    if (invite.accepted_at) throw new Error("This invite has already been accepted.");
    if (new Date(invite.expires_at).getTime() < Date.now()) throw new Error("This invite has expired.");
    if (email && invite.email.toLowerCase() !== email) {
      throw new Error(`This invite was sent to ${invite.email}.`);
    }
    const { error: me } = await supabase.from("company_members").upsert({
      company_id: invite.company_id,
      user_id: userId,
      role: invite.role,
      status: "active",
      invited_by: null,
    }, { onConflict: "company_id,user_id" });
    if (me) throw new Error(me.message);
    await supabase.from("company_invites").update({ accepted_at: new Date().toISOString() }).eq("id", invite.id);
    return { companyId: invite.company_id as string };
  });

export const removeMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("company_members").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
