import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getPaddleClient, type PaddleEnv } from "@/lib/paddle.server";

// Open the Paddle hosted customer portal so the user can update their
// payment method, view invoices, or cancel. Returns a short-lived URL —
// generate a fresh one each time the user clicks "Manage subscription".
export const createPaddlePortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // Pick the most recent Paddle subscription row for this user.
    const { data: sub, error } = await supabase
      .from("subscriptions")
      .select("paddle_subscription_id, paddle_customer_id, environment")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!sub) throw new Error("No subscription found");

    const env = (sub.environment ?? "sandbox") as PaddleEnv;
    const paddle = getPaddleClient(env);
    const session = await paddle.customerPortalSessions.create(
      sub.paddle_customer_id as string,
      [sub.paddle_subscription_id as string],
    );

    return {
      url: session.urls.general.overview,
      cancelUrl:
        session.urls.subscriptions?.[0]?.cancelSubscription ?? null,
    };
  });
