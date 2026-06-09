import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PLANS } from "./plans";

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
          title: "Career Boost — " + plan.name,
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

function logActivation(
  event: string,
  fields: Record<string, unknown>,
) {
  // Structured single-line JSON makes worker logs grep-friendly.
  // Search worker logs for `flw_activation` to retrieve the full trail.
  console.log(
    "flw_activation " +
      JSON.stringify({ event, ts: new Date().toISOString(), ...fields }),
  );
}

export const verifyFlutterwavePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => VerifySchema.parse(input))
  .handler(async ({ data, context }) => {
    const startedAt = Date.now();
    const elapsed = () => Date.now() - startedAt;

    const secret = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!secret) {
      logActivation("config_missing", { tx_ref: data.tx_ref, elapsed_ms: elapsed() });
      throw new Error("Payments are not configured.");
    }

    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    logActivation("verify_start", {
      user_id: userId,
      tx_ref: data.tx_ref,
      transaction_id: data.transaction_id,
      elapsed_ms: elapsed(),
    });

    // Snapshot last known plan up-front for diagnostics
    const { data: profileBefore } = await supabaseAdmin
      .from("profiles")
      .select("plan, plan_tier, pro_expires_at")
      .eq("id", userId)
      .maybeSingle();

    // Find our pending payment row
    const { data: payment, error: payErr } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("tx_ref", data.tx_ref)
      .eq("user_id", userId)
      .maybeSingle();
    if (payErr) {
      logActivation("payment_lookup_error", {
        user_id: userId,
        tx_ref: data.tx_ref,
        last_known_plan: profileBefore?.plan,
        last_known_plan_tier: profileBefore?.plan_tier,
        error: payErr.message,
        elapsed_ms: elapsed(),
      });
      throw new Error(payErr.message);
    }
    if (!payment) {
      logActivation("payment_not_found", {
        user_id: userId,
        tx_ref: data.tx_ref,
        last_known_plan: profileBefore?.plan,
        last_known_plan_tier: profileBefore?.plan_tier,
        elapsed_ms: elapsed(),
      });
      throw new Error("Payment not found.");
    }

    if (payment.status === "successful") {
      logActivation("already_verified", {
        user_id: userId,
        tx_ref: data.tx_ref,
        payment_id: payment.id,
        plan_tier: payment.plan_tier,
        last_known_plan: profileBefore?.plan,
        last_known_plan_tier: profileBefore?.plan_tier,
        elapsed_ms: elapsed(),
      });
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
      logActivation("flw_verify_failed", {
        user_id: userId,
        tx_ref: data.tx_ref,
        transaction_id: data.transaction_id,
        payment_id: payment.id,
        plan_tier: payment.plan_tier,
        http_status: resp.status,
        flw_status: body.status,
        flw_message: body.message,
        flw_tx_status: tx?.status,
        flw_tx_ref_match: tx?.tx_ref === payment.tx_ref,
        flw_currency_match: tx?.currency === payment.currency,
        flw_amount: tx?.amount,
        expected_amount: payment.amount,
        last_known_plan: profileBefore?.plan,
        last_known_plan_tier: profileBefore?.plan_tier,
        elapsed_ms: elapsed(),
      });
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

    logActivation("flw_verify_ok", {
      user_id: userId,
      tx_ref: data.tx_ref,
      payment_id: payment.id,
      plan_tier: payment.plan_tier,
      elapsed_ms: elapsed(),
    });

    // Activate plan FIRST so a failure here prevents marking the payment successful.
    const { error: rpcErr } = await supabaseAdmin.rpc("activate_pro_plan", {
      _user_id: userId,
      _plan_tier: payment.plan_tier,
      _days: 30,
    });
    if (rpcErr) {
      logActivation("activate_pro_plan_failed", {
        user_id: userId,
        tx_ref: data.tx_ref,
        payment_id: payment.id,
        plan_tier: payment.plan_tier,
        last_known_plan: profileBefore?.plan,
        last_known_plan_tier: profileBefore?.plan_tier,
        rpc_error: rpcErr.message,
        rpc_code: (rpcErr as { code?: string }).code,
        elapsed_ms: elapsed(),
      });
      throw new Error(rpcErr.message);
    }

    const { error: payUpdErr } = await supabaseAdmin
      .from("payments")
      .update({
        status: "successful",
        flw_transaction_id: data.transaction_id,
        flw_response: JSON.parse(JSON.stringify(body)),
        verified_at: new Date().toISOString(),
      })
      .eq("id", payment.id);
    if (payUpdErr) {
      logActivation("payment_mark_successful_failed", {
        user_id: userId,
        tx_ref: data.tx_ref,
        payment_id: payment.id,
        plan_tier: payment.plan_tier,
        error: payUpdErr.message,
        elapsed_ms: elapsed(),
      });
      throw new Error(payUpdErr.message);
    }

    logActivation("activation_complete", {
      user_id: userId,
      tx_ref: data.tx_ref,
      payment_id: payment.id,
      plan_tier: payment.plan_tier,
      previous_plan: profileBefore?.plan,
      previous_plan_tier: profileBefore?.plan_tier,
      elapsed_ms: elapsed(),
    });

    return { ok: true, alreadyVerified: false, planTier: payment.plan_tier };
  });
