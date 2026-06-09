import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ADMIN_ROLES, assertSuperAdmin, type AppRole } from "@/lib/admin-access";

const ROLES = ADMIN_ROLES;

async function loadCurrentRoles(_supabase: any, userId: string): Promise<AppRole[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("suspended", false);
  return (data ?? []).map((r: { role: AppRole }) => r.role);
}

function requireAdmin(roles: AppRole[]) {
  assertSuperAdmin(roles);
}
function requireSuper(roles: AppRole[]) {
  assertSuperAdmin(roles);
}


// Generic server-side error helper: log details, surface safe message.
function failSafely(scope: string, error: unknown): never {
  console.error(`[admin:${scope}]`, error);
  throw new Error("Operation failed. Please try again or contact support.");
}


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
      { data: monthlyPayments },
      { data: totalPayments },
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
      supabaseAdmin.from("payments").select("amount").eq("status", "successful").gte("verified_at", startOfMonth.toISOString()),
      supabaseAdmin.from("payments").select("amount").eq("status", "successful"),
      supabaseAdmin.from("analyses").select("created_at").gte("created_at", new Date(now.getTime() - 30 * 86400000).toISOString()),
      supabaseAdmin.from("profiles").select("created_at").gte("created_at", new Date(now.getTime() - 30 * 86400000).toISOString()),
    ]);

    const activeSubs = revenueRows?.length ?? 0;
    const monthlyRevenue = (monthlyPayments ?? []).reduce((s: number, r: { amount: number | string }) => s + Number(r.amount || 0), 0);
    const totalRevenue = (totalPayments ?? []).reduce((s: number, r: { amount: number | string }) => s + Number(r.amount || 0), 0);
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
      .select("id, plan, plan_tier, suspended, pro_started_at, pro_expires_at, created_at")
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

    const rows = (profiles ?? []).map((p: { id: string; plan: string; plan_tier: string | null; suspended: boolean; pro_expires_at: string | null; created_at: string }) => ({
      id: p.id,
      email: emailMap.get(p.id) ?? "",
      plan: p.plan,
      plan_tier: p.plan_tier ?? "free",
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
    if (error) failSafely("db", error);
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
    if (error) failSafely("db", error);
    await logActivity(supabase, userId, (claims as { email?: string }).email ?? null,
      "user.delete", { type: "user", id: data.userId });
    return { ok: true };
  });

export const setUserPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    userId: z.string().uuid(),
    planTier: z.enum(["free", "pro_1", "pro_2"]),
    months: z.number().int().min(1).max(36).optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    requireSuper(await loadCurrentRoles(supabase, userId));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date();
    const isPro = data.planTier !== "free";
    const update: {
      plan: "free" | "pro";
      plan_tier: "free" | "pro_1" | "pro_2";
      pro_started_at: string | null;
      pro_expires_at: string | null;
    } = {
      plan: isPro ? "pro" : "free",
      plan_tier: data.planTier,
      pro_started_at: null,
      pro_expires_at: null,
    };
    if (isPro) {
      const months = data.months ?? 1;
      update.pro_started_at = now.toISOString();
      update.pro_expires_at = new Date(now.getTime() + months * 30 * 86400000).toISOString();
    }
    const { error } = await supabaseAdmin.from("profiles").update(update).eq("id", data.userId);
    if (error) failSafely("db", error);
    await logActivity(supabase, userId, (claims as { email?: string }).email ?? null,
      "user.set_plan", { type: "user", id: data.userId, metadata: { plan_tier: data.planTier, months: data.months } });
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
    if (error) failSafely("db", error);
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
    if (error) failSafely("db", error);
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
    if (error) failSafely("db", error);
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
    if (error) failSafely("db", error);
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

// ---------- Activation diagnostics ----------
const ActivationEventsSchema = z.object({
  search: z.string().trim().max(200).optional(),
  status: z.enum(["all", "failure", "success"]).default("all"),
  event: z.string().max(60).optional(),
  hours: z.number().int().min(1).max(720).default(168),
}).partial({ search: true, event: true });

export const listActivationEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ActivationEventsSchema.parse(i ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    requireAdmin(await loadCurrentRoles(supabase, userId));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const since = new Date(Date.now() - (data.hours ?? 168) * 3600_000).toISOString();
    let query = supabaseAdmin
      .from("payment_activation_events")
      .select("id, created_at, event, success, user_id, tx_ref, payment_id, plan_tier, last_known_plan, last_known_plan_tier, elapsed_ms, error_message, metadata")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(300);

    if (data.status === "failure") query = query.eq("success", false);
    if (data.status === "success") query = query.eq("success", true);
    if (data.event) query = query.eq("event", data.event);

    const search = data.search?.trim();
    if (search) {
      const escaped = search.replace(/[%,]/g, "");
      const isUuid = /^[0-9a-f-]{36}$/i.test(search);
      let userIdFromEmail: string | null = null;
      if (search.includes("@")) {
        const { data: users } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const u = users.users.find((x) => (x.email ?? "").toLowerCase().includes(search.toLowerCase()));
        userIdFromEmail = u?.id ?? null;
      }
      const noMatch = "00000000-0000-0000-0000-000000000000";
      query = query.or(
        `tx_ref.ilike.%${escaped}%,user_id.eq.${isUuid ? search : userIdFromEmail ?? noMatch},error_message.ilike.%${escaped}%,plan_tier.ilike.%${escaped}%`,
      );
    }

    const { data: rows, error } = await query;
    if (error) failSafely("activation_events", error);

    // Resolve emails for the users in the result set.
    const userIds = Array.from(new Set((rows ?? []).map((r) => r.user_id).filter(Boolean) as string[]));
    const emailMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: users } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      for (const u of users.users) {
        if (userIds.includes(u.id) && u.email) emailMap[u.id] = u.email;
      }
    }

    return (rows ?? []).map((r) => ({ ...r, user_email: r.user_id ? emailMap[r.user_id] ?? null : null }));
  });

// Reconcile payments that are 'successful' but whose owning profile is not on
// the matching pro plan. Re-runs activate_pro_plan idempotently.
export const reconcileStuckActivations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    requireAdmin(await loadCurrentRoles(supabase, userId));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const since = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();
    const { data: payments } = await supabaseAdmin
      .from("payments")
      .select("id, user_id, tx_ref, plan_tier, created_at")
      .eq("status", "successful")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(500);

    const repaired: Array<{ tx_ref: string; user_id: string; plan_tier: string }> = [];
    const failed: Array<{ tx_ref: string; user_id: string; reason: string }> = [];
    let scanned = 0;

    for (const p of payments ?? []) {
      scanned++;
      const { data: prof } = await supabaseAdmin
        .from("profiles")
        .select("plan, plan_tier, pro_expires_at")
        .eq("id", p.user_id)
        .maybeSingle();

      const expired = prof?.pro_expires_at ? new Date(prof.pro_expires_at as string) <= new Date() : true;
      const matches = prof?.plan === "pro" && prof?.plan_tier === p.plan_tier && !expired;
      if (matches) continue;

      const { error: rpcErr } = await supabaseAdmin.rpc("activate_pro_plan", {
        _user_id: p.user_id,
        _plan_tier: p.plan_tier,
        _days: 30,
      });

      const { data: after } = await supabaseAdmin
        .from("profiles")
        .select("plan, plan_tier")
        .eq("id", p.user_id)
        .maybeSingle();

      const ok = !rpcErr && after?.plan === "pro" && after?.plan_tier === p.plan_tier;
      await supabaseAdmin.from("payment_activation_events").insert({
        event: ok ? "activation_recovered_by_admin" : "activation_no_effect",
        success: ok,
        user_id: p.user_id,
        tx_ref: p.tx_ref,
        payment_id: p.id,
        plan_tier: p.plan_tier,
        last_known_plan: prof?.plan,
        last_known_plan_tier: prof?.plan_tier,
        error_message: rpcErr?.message ?? null,
        metadata: { source: "admin_reconcile", admin_user_id: userId } as never,
      });

      if (ok) repaired.push({ tx_ref: p.tx_ref, user_id: p.user_id, plan_tier: p.plan_tier });
      else failed.push({ tx_ref: p.tx_ref, user_id: p.user_id, reason: rpcErr?.message ?? "profile not updated" });
    }

    return { scanned, repaired, failed };
  });
