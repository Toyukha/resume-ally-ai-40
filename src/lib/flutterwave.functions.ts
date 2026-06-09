import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PLANS } from "./plans";

const ALLOWED_ORIGINS = new Set([
  "https://thecareerboost.com",
  "https://www.thecareerboost.com",
  "https://resume-ally-ai-40.lovable.app",
]);

const InitSchema = z.object({
  planTier: z.enum(["pro_1", "pro_2"]),
});

const VerifySchema = z.object({
  tx_ref: z.string().min(4).max(120),
  transaction_id: z.string().min(1).max(60),
});

const FLW_API = "https://api.flutterwave.com/v3";


export const initFlutterwavePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InitSchema.parse(input))
  .handler(async ({ data, context }) => {
    const secret = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!secret) throw new Error("Payments are not configured. Please contact support.");

    const { userId, supabase } = context;
    const plan = PLANS[data.planTier];

    // Get user email for receipt
    const { data: userRes } = await supabase.auth.getUser();
    const email = userRes.user?.email ?? "customer@example.com";
    const name = (userRes.user?.user_metadata?.full_name as string) || email.split("@")[0];

    const txRef = `GTJ-${data.planTier}-${userId.slice(0, 8)}-${Date.now()}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: insertErr } = await supabaseAdmin.from("payments").insert({
      user_id: userId,
      tx_ref: txRef,
      plan_tier: data.planTier,
      amount: plan.priceNGN,
      currency: "NGN",
      status: "pending",
    });
    if (insertErr) throw new Error(`Could not start payment: ${insertErr.message}`);

    const redirectUrl = "https://thecareerboost.com/payment-callback";

    const resp = await fetch(`${FLW_API}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: plan.priceNGN,
        currency: "NGN",
        redirect_url: redirectUrl,
        customer: { email, name },
        customizations: {
          title: "Get That Job — " + plan.name,
          description: `${plan.name} subscription (30 days)`,
        },
        meta: { user_id: userId, plan_tier: data.planTier },
      }),
    });
    const body = (await resp.json()) as { status: string; message?: string; data?: { link?: string } };
    if (!resp.ok || body.status !== "success" || !body.data?.link) {
      throw new Error(body.message || "Failed to initialise payment");
    }

    return { checkoutUrl: body.data.link, txRef };
  });

export const verifyFlutterwavePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => VerifySchema.parse(input))
  .handler(async ({ data, context }) => {
    const secret = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!secret) throw new Error("Payments are not configured.");

    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Find our pending payment row
    const { data: payment, error: payErr } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("tx_ref", data.tx_ref)
      .eq("user_id", userId)
      .maybeSingle();
    if (payErr) throw new Error(payErr.message);
    if (!payment) throw new Error("Payment not found.");

    if (payment.status === "successful") {
      return { ok: true, alreadyVerified: true, planTier: payment.plan_tier };
    }

    // Verify with Flutterwave
    const resp = await fetch(`${FLW_API}/transactions/${encodeURIComponent(data.transaction_id)}/verify`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const body = (await resp.json()) as {
      status: string;
      message?: string;
      data?: {
        status: string;
        amount: number;
        currency: string;
        tx_ref: string;
      };
    };

    const tx = body?.data;
    const ok =
      resp.ok &&
      body.status === "success" &&
      tx?.status === "successful" &&
      tx.tx_ref === payment.tx_ref &&
      tx.currency === payment.currency &&
      Number(tx.amount) >= Number(payment.amount);

    if (!ok) {
      await supabaseAdmin
        .from("payments")
        .update({
          status: "failed",
          flw_transaction_id: data.transaction_id,
          flw_response: JSON.parse(JSON.stringify(body)),
          verified_at: new Date().toISOString(),
        })
        .eq("id", payment.id);
      throw new Error(body.message || "Payment could not be verified.");
    }

    // Activate plan for 30 days
    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const updates = await Promise.all([
      supabaseAdmin
        .from("payments")
        .update({
          status: "successful",
          flw_transaction_id: data.transaction_id,
          flw_response: JSON.parse(JSON.stringify(body)),
          verified_at: now.toISOString(),
        })
        .eq("id", payment.id),
      supabaseAdmin
        .from("profiles")
        .update({
          plan: "pro",
          plan_tier: payment.plan_tier,
          pro_started_at: now.toISOString(),
          pro_expires_at: expires.toISOString(),
        })
        .eq("id", userId),
    ]);
    for (const u of updates) {
      if (u.error) throw new Error(u.error.message);
    }

    return { ok: true, alreadyVerified: false, planTier: payment.plan_tier };
  });
