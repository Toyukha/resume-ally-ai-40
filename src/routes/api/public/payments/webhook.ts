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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionCreated(data: any, env: PaddleEnv) {
  const { id, customerId, items, status, currentBillingPeriod, customData } = data;
  const userId: string | undefined = customData?.userId;
  if (!userId) {
    console.error("paddle_webhook: no userId in customData", { id });
    return;
  }
  const item = items?.[0];
  const priceId: string | undefined = item?.price?.importMeta?.externalId;
  const productId: string | undefined = item?.product?.importMeta?.externalId;
  if (!priceId || !productId) {
    console.warn("paddle_webhook: missing importMeta.externalId", { id, rawPriceId: item?.price?.id });
    return;
  }
  if (!isPlanTier(productId)) {
    console.warn("paddle_webhook: unknown product_id, not activating", { productId });
    return;
  }

  const supabase = getSupabase();
  await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      paddle_subscription_id: id,
      paddle_customer_id: customerId,
      product_id: productId,
      price_id: priceId,
      status,
      current_period_start: currentBillingPeriod?.startsAt ?? null,
      current_period_end: currentBillingPeriod?.endsAt ?? null,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "paddle_subscription_id" },
  );

  // Activate Pro for the user using the real billing-period end so cancel
  // grants access until period end automatically.
  const expiresAt = currentBillingPeriod?.endsAt;
  if (expiresAt) {
    const { error } = await supabase.rpc("activate_pro_plan_until", {
      _user_id: userId,
      _plan_tier: productId,
      _expires_at: expiresAt,
    });
    if (error) console.error("activate_pro_plan_until failed (created):", error.message);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionUpdated(data: any, env: PaddleEnv) {
  const { id, status, currentBillingPeriod, scheduledChange, items } = data;
  const supabase = getSupabase();

  const item = items?.[0];
  const priceId: string | undefined = item?.price?.importMeta?.externalId;
  const productId: string | undefined = item?.product?.importMeta?.externalId;

  await supabase
    .from("subscriptions")
    .update({
      status,
      product_id: productId ?? undefined,
      price_id: priceId ?? undefined,
      current_period_start: currentBillingPeriod?.startsAt ?? null,
      current_period_end: currentBillingPeriod?.endsAt ?? null,
      cancel_at_period_end: scheduledChange?.action === "cancel",
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", id)
    .eq("environment", env);

  // Re-activate or update plan tier (covers upgrades/downgrades + renewals).
  // We only touch the profile when Paddle reports the sub is healthy AND we
  // know the tier. Canceled / past_due rows leave pro_expires_at alone so the
  // existing grace period naturally elapses.
  const expiresAt = currentBillingPeriod?.endsAt;
  if (
    expiresAt &&
    isPlanTier(productId) &&
    (status === "active" || status === "trialing")
  ) {
    // Find the owning user
    const { data: subRow } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("paddle_subscription_id", id)
      .eq("environment", env)
      .maybeSingle();

    const userId = subRow?.user_id as string | undefined;
    if (userId) {
      const { error } = await supabase.rpc("activate_pro_plan_until", {
        _user_id: userId,
        _plan_tier: productId,
        _expires_at: expiresAt,
      });
      if (error) console.error("activate_pro_plan_until failed (updated):", error.message);
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
