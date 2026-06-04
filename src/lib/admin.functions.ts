import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ROLES = ["super_admin", "admin", "support_admin", "analytics_admin"] as const;
type AppRole = (typeof ROLES)[number];

async function loadCurrentRoles(supabase: any, userId: string): Promise<AppRole[]> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("suspended", false);
  return (data ?? []).map((r: { role: AppRole }) => r.role);
}

function requireAdmin(roles: AppRole[]) {
  if (!roles.includes("super_admin")) throw new Error("Forbidden: super_admin required");
}
function requireSuper(roles: AppRole[]) {
  if (!roles.includes("super_admin")) throw new Error("Forbidden: super_admin required");
}

// ---------- Bootstrap super admin (idempotent, public) ----------
export const bootstrapSuperAdmin = createServerFn({ method: "POST" })
  .handler(async () => {
    const EMAIL = "oyeyemiyunus24@gmail.com";
    const PASSWORD = "Vanguards@180?";
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Find user
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    let user = list.users.find((u) => (u.email ?? "").toLowerCase() === EMAIL);

    if (!user) {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true,
      });
      if (error) throw new Error(error.message);
      user = created.user!;
    } else {
      // Enforce the password every time
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: PASSWORD,
        email_confirm: true,
      });
    }

    // Ensure super_admin role
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: user.id, role: "super_admin", suspended: false }, { onConflict: "user_id,role" });

    return { ok: true };
  });

async function logActivity(
  supabase: any,
  actorId: string,
  actorEmail: string | null,
  action: string,
  target?: { type?: string; id?: string; metadata?: Record<string, unknown> },
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("admin_activity_logs").insert({
    actor_id: actorId,
    actor_email: actorEmail,
    action,
    target_type: target?.type ?? null,
    target_id: target?.id ?? null,
    metadata: (target?.metadata ?? {}) as never,
  });
}

// ---------- Me ----------
export const getAdminMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;
    const roles = await loadCurrentRoles(supabase, userId);
    return {
      isAdmin: roles.length > 0,
      roles,
      email: (claims as { email?: string }).email ?? null,
    };
  });

// ---------- Platform stats ----------
export const getPlatformStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    requireAdmin(await loadCurrentRoles(supabase, userId));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const now = new Date();
    const startOfDay = new Date(now); startOfDay.setUTCHours(0, 0, 0, 0);
    const startOfMonth = new Date(now); startOfMonth.setUTCDate(1); startOfMonth.setUTCHours(0, 0, 0, 0);

    const [
      { count: totalUsers },
      { count: newUsersToday },
      { count: newUsersThisMonth },
      { count: totalAnalyses },
      { count: analysesToday },
      { count: analysesThisMonth },
      { count: proUsers },
      { data: revenueRows },
      { data: dailyAnalyses },
      { data: dailyUsers },
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", startOfDay.toISOString()),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", startOfMonth.toISOString()),
      supabaseAdmin.from("analyses").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("analyses").select("id", { count: "exact", head: true }).gte("created_at", startOfDay.toISOString()),
      supabaseAdmin.from("analyses").select("id", { count: "exact", head: true }).gte("created_at", startOfMonth.toISOString()),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).eq("plan", "pro").gt("pro_expires_at", now.toISOString()),
      supabaseAdmin.from("profiles").select("pro_started_at").eq("plan", "pro").gt("pro_expires_at", now.toISOString()),
      supabaseAdmin.from("analyses").select("created_at").gte("created_at", new Date(now.getTime() - 30 * 86400000).toISOString()),
      supabaseAdmin.from("profiles").select("created_at").gte("created_at", new Date(now.getTime() - 30 * 86400000).toISOString()),
    ]);

    const PRO_PRICE = 5000;
    const activeSubs = revenueRows?.length ?? 0;
    const monthlyRevenue = activeSubs * PRO_PRICE;
    const totalRevenue = monthlyRevenue; // single recurring product; extend if multi-tier
    const conversionRate = totalUsers ? Math.round((activeSubs / totalUsers) * 1000) / 10 : 0;

    // Build last-30-day buckets
    const buckets: Record<string, { day: string; analyses: number; signups: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = { day: key, analyses: 0, signups: 0 };
    }
    (dailyAnalyses ?? []).forEach((r: { created_at: string }) => {
      const k = r.created_at.slice(0, 10);
      if (buckets[k]) buckets[k].analyses++;
    });
    (dailyUsers ?? []).forEach((r: { created_at: string }) => {
      const k = r.created_at.slice(0, 10);
      if (buckets[k]) buckets[k].signups++;
    });
    const trend = Object.values(buckets);

    return {
      totalUsers: totalUsers ?? 0,
      activeUsers: activeSubs,
      newUsersToday: newUsersToday ?? 0,
      newUsersThisMonth: newUsersThisMonth ?? 0,
      totalAnalyses: totalAnalyses ?? 0,
      analysesToday: analysesToday ?? 0,
      analysesThisMonth: analysesThisMonth ?? 0,
      totalRevenue,
      monthlyRevenue,
      activeSubscribers: activeSubs,
      conversionRate,
      trend,
    };
  });

// ---------- Users ----------
export const listAllUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ search: z.string().max(200).optional() }).parse(i ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    requireAdmin(await loadCurrentRoles(supabase, userId));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, plan, suspended, pro_started_at, pro_expires_at, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    const ids = (profiles ?? []).map((p: { id: string }) => p.id);
    const { data: emails } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const emailMap = new Map(emails.users.map((u) => [u.id, u.email ?? ""]));

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role, suspended")
      .in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

    const { data: counts } = await supabaseAdmin
      .from("analyses")
      .select("user_id")
      .in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const countMap = new Map<string, number>();
    (counts ?? []).forEach((c: { user_id: string }) => countMap.set(c.user_id, (countMap.get(c.user_id) ?? 0) + 1));

    const rolesMap = new Map<string, AppRole[]>();
    (roles ?? []).forEach((r: { user_id: string; role: AppRole; suspended: boolean }) => {
      if (r.suspended) return;
      const arr = rolesMap.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesMap.set(r.user_id, arr);
    });

    const rows = (profiles ?? []).map((p: { id: string; plan: string; suspended: boolean; pro_expires_at: string | null; created_at: string }) => ({
      id: p.id,
      email: emailMap.get(p.id) ?? "",
      plan: p.plan,
      suspended: p.suspended,
      pro_expires_at: p.pro_expires_at,
      created_at: p.created_at,
      analyses: countMap.get(p.id) ?? 0,
      roles: rolesMap.get(p.id) ?? [],
    }));

    const q = data.search?.toLowerCase().trim();
    return q ? rows.filter((r) => r.email.toLowerCase().includes(q) || r.id.includes(q)) : rows;
  });

export const setUserSuspended = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ userId: z.string().uuid(), suspended: z.boolean() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    requireSuper(await loadCurrentRoles(supabase, userId));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("profiles").update({ suspended: data.suspended }).eq("id", data.userId);
    if (error) throw new Error(error.message);
    await logActivity(supabase, userId, (claims as { email?: string }).email ?? null,
      data.suspended ? "user.suspend" : "user.reactivate", { type: "user", id: data.userId });
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ userId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    requireSuper(await loadCurrentRoles(supabase, userId));
    if (data.userId === userId) throw new Error("Cannot delete your own account.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    await logActivity(supabase, userId, (claims as { email?: string }).email ?? null,
      "user.delete", { type: "user", id: data.userId });
    return { ok: true };
  });

export const setUserPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    userId: z.string().uuid(),
    plan: z.enum(["free", "pro"]),
    months: z.number().int().min(1).max(36).optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    requireSuper(await loadCurrentRoles(supabase, userId));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date();
    const update: { plan: "free" | "pro"; pro_started_at: string | null; pro_expires_at: string | null } = {
      plan: data.plan,
      pro_started_at: null,
      pro_expires_at: null,
    };
    if (data.plan === "pro") {
      const months = data.months ?? 1;
      update.pro_started_at = now.toISOString();
      update.pro_expires_at = new Date(now.getTime() + months * 30 * 86400000).toISOString();
    }
    const { error } = await supabaseAdmin.from("profiles").update(update).eq("id", data.userId);
    if (error) throw new Error(error.message);
    await logActivity(supabase, userId, (claims as { email?: string }).email ?? null,
      "user.set_plan", { type: "user", id: data.userId, metadata: { plan: data.plan, months: data.months } });
    return { ok: true };
  });

export const resetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ email: z.string().email() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    requireSuper(await loadCurrentRoles(supabase, userId));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.generateLink({ type: "recovery", email: data.email });
    if (error) throw new Error(error.message);
    await logActivity(supabase, userId, (claims as { email?: string }).email ?? null,
      "user.password_reset", { type: "user", metadata: { email: data.email } });
    return { ok: true };
  });

// ---------- Admins ----------
export const listAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    requireAdmin(await loadCurrentRoles(supabase, userId));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("id, user_id, role, suspended, created_at, assigned_by")
      .order("created_at", { ascending: false });
    const { data: users } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const emailMap = new Map(users.users.map((u) => [u.id, u.email ?? ""]));
    return (roles ?? []).map((r: { id: string; user_id: string; role: AppRole; suspended: boolean; created_at: string; assigned_by: string | null }) => ({
      ...r,
      email: emailMap.get(r.user_id) ?? "",
    }));
  });

export const addAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    email: z.string().email(),
    role: z.enum(ROLES),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    requireSuper(await loadCurrentRoles(supabase, userId));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: users } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const target = users.users.find((u) => (u.email ?? "").toLowerCase() === data.email.toLowerCase());
    if (!target) throw new Error("No user exists with that email. They must sign up first.");

    const { error } = await supabaseAdmin.from("user_roles").insert({
      user_id: target.id,
      role: data.role,
      assigned_by: userId,
    });
    if (error) throw new Error(error.message);
    await logActivity(supabase, userId, (claims as { email?: string }).email ?? null,
      "admin.add", { type: "user", id: target.id, metadata: { role: data.role, email: data.email } });
    return { ok: true };
  });

export const removeAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    requireSuper(await loadCurrentRoles(supabase, userId));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("user_roles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logActivity(supabase, userId, (claims as { email?: string }).email ?? null,
      "admin.remove", { type: "user_role", id: data.id });
    return { ok: true };
  });

export const setAdminSuspended = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid(), suspended: z.boolean() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    requireSuper(await loadCurrentRoles(supabase, userId));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("user_roles").update({ suspended: data.suspended }).eq("id", data.id);
    if (error) throw new Error(error.message);
    await logActivity(supabase, userId, (claims as { email?: string }).email ?? null,
      data.suspended ? "admin.suspend" : "admin.reactivate", { type: "user_role", id: data.id });
    return { ok: true };
  });

// ---------- Analyses ----------
export const listAllAnalyses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    requireAdmin(await loadCurrentRoles(supabase, userId));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("analyses")
      .select("id, user_id, resume_filename, match_score, summary, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    return data ?? [];
  });

// ---------- Activity logs ----------
export const listActivityLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    requireAdmin(await loadCurrentRoles(supabase, userId));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("admin_activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    return data ?? [];
  });
