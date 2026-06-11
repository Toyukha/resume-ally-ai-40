import { createFileRoute } from "@tanstack/react-router";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { verifyWebhook, EventName, type PaddleEnv } from "@/lib/paddle.server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabase: SupabaseClient<any, "public", any> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as SupabaseClient<any, "public", any>;
  }
  return _supabase;
}

type PlanTier = "pro_1" | "pro_2";
function isPlanTier(v: unknown): v is PlanTier {
  return v === "pro_1" || v === "pro_2";
}

// Resolve the plan tier from a Paddle event item. The catalog uses
// external IDs `pro_plan_1` / `pro_plan_2`; the checkout also passes
// `planTier` in customData. Prefer customData (most explicit), fall back to
// the product external_id mapping.
function resolvePlanTier(
  productExternalId: string | undefined,
  customDataPlanTier: unknown,
): PlanTier | null {
  if (isPlanTier(customDataPlanTier)) return customDataPlanTier;
  if (productExternalId === "pro_plan_1" || productExternalId === "pro_1") return "pro_1";
  if (productExternalId === "pro_plan_2" || productExternalId === "pro_2") return "pro_2";
  return null;
}

// Activate Pro with the Paddle billing-period end. If that is missing or
// already past (rare, but can happen on delayed events), fall back to a
// 30-day window so the user is not stranded on Free after a successful
// payment.
async function activatePro(
  supabase: SupabaseClient,
  userId: string,
  tier: PlanTier,
  expiresAt: string | undefined,
) {
  const expiresDate = expiresAt ? new Date(expiresAt) : null;
  if (expiresDate && expiresDate.getTime() > Date.now()) {
    const { error } = await supabase.rpc("activate_pro_plan_until", {
      _user_id: userId,
      _plan_tier: tier,
      _expires_at: expiresDate.toISOString(),
    });
    if (!error) return;
    console.error("activate_pro_plan_until failed, falling back to +30d:", error.message);
  }
  const { error } = await supabase.rpc("activate_pro_plan", {
    _user_id: userId,
    _plan_tier: tier,
    _days: 30,
  });
  if (error) console.error("activate_pro_plan fallback failed:", error.message);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionCreated(data: any, env: PaddleEnv) {
  const { id, customerId, items, status, currentBillingPeriod, customData } = data;
  const userId: string | undefined = customData?.userId;
  if (!userId) {
    console.error("paddle_webhook: no userId in customData", { id });
    return;
  }
  const item = items?.[0];
  const priceExternalId: string | undefined = item?.price?.importMeta?.externalId;
  const productExternalId: string | undefined = item?.product?.importMeta?.externalId;
  const tier = resolvePlanTier(productExternalId, customData?.planTier);
  if (!tier) {
    console.warn("paddle_webhook: could not resolve plan tier", {
      id,
      productExternalId,
      customDataPlanTier: customData?.planTier,
    });
    return;
  }

  const supabase = getSupabase();
  await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      paddle_subscription_id: id,
      paddle_customer_id: customerId,
      product_id: tier, // store canonical tier so reads stay consistent
      price_id: priceExternalId ?? `${tier}_monthly`,
      status,
      current_period_start: currentBillingPeriod?.startsAt ?? null,
      current_period_end: currentBillingPeriod?.endsAt ?? null,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "paddle_subscription_id" },
  );

  await activatePro(supabase, userId, tier, currentBillingPeriod?.endsAt);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionUpdated(data: any, env: PaddleEnv) {
  const { id, status, currentBillingPeriod, scheduledChange, items, customData } = data;
  const supabase = getSupabase();

  const item = items?.[0];
  const priceExternalId: string | undefined = item?.price?.importMeta?.externalId;
  const productExternalId: string | undefined = item?.product?.importMeta?.externalId;
  const tier = resolvePlanTier(productExternalId, customData?.planTier);

  await supabase
    .from("subscriptions")
    .update({
      status,
      product_id: tier ?? undefined,
      price_id: priceExternalId ?? (tier ? `${tier}_monthly` : undefined),
      current_period_start: currentBillingPeriod?.startsAt ?? null,
      current_period_end: currentBillingPeriod?.endsAt ?? null,
      cancel_at_period_end: scheduledChange?.action === "cancel",
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", id)
    .eq("environment", env);

  // Re-activate or update plan tier (covers upgrades/downgrades + renewals).
  // Only touch the profile while Paddle reports the sub is healthy.
  // Canceled / past_due rows leave pro_expires_at alone so the existing
  // grace period naturally elapses.
  if (tier && (status === "active" || status === "trialing")) {
    // Prefer userId from event customData (avoids a race when update arrives
    // before created has finished inserting). Fall back to the DB row.
    let userId: string | undefined = customData?.userId;
    if (!userId) {
      const { data: subRow } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("paddle_subscription_id", id)
        .eq("environment", env)
        .maybeSingle();
      userId = subRow?.user_id as string | undefined;
    }
    if (userId) {
      await activatePro(supabase, userId, tier, currentBillingPeriod?.endsAt);
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  // Soft cancel: only mark the row. Profile.pro_expires_at remains set, so
  // the user keeps Pro until the end of the period they already paid for.
  await getSupabase()
    .from("subscriptions")
    .update({
      status: "canceled",
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", data.id)
    .eq("environment", env);
}

async function handleWebhook(req: Request, env: PaddleEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.eventType) {
    case EventName.SubscriptionCreated:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await handleSubscriptionCreated(event.data as any, env);
      break;
    case EventName.SubscriptionUpdated:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await handleSubscriptionUpdated(event.data as any, env);
      break;
    case EventName.SubscriptionCanceled:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await handleSubscriptionCanceled(event.data as any, env);
      break;
    default:
      console.log("paddle_webhook: unhandled", event.eventType);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const env = (url.searchParams.get("env") || "sandbox") as PaddleEnv;
        try {
          await handleWebhook(request, env);
          return Response.json({ received: true });
        } catch (e) {
          console.error("paddle_webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
