import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "crypto";

const FLW_API = "https://api.flutterwave.com/v3";

async function persistEvent(event: string, fields: Record<string, unknown>) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("payment_activation_events").insert({
      event,
      success: event === "activation_complete" || event === "activation_recovered_via_webhook" || event === "already_verified",
      user_id: (fields.user_id as string) ?? null,
      tx_ref: (fields.tx_ref as string) ?? null,
      payment_id: (fields.payment_id as string) ?? null,
      plan_tier: (fields.plan_tier as string) ?? null,
      last_known_plan: (fields.last_known_plan as string) ?? null,
      last_known_plan_tier: (fields.last_known_plan_tier as string) ?? null,
      elapsed_ms: typeof fields.elapsed_ms === "number" ? (fields.elapsed_ms as number) : null,
      error_message:
        (fields.error as string) ?? (fields.rpc_error as string) ?? (fields.flw_message as string) ?? null,
      metadata: { ...fields, source: fields.source ?? "webhook" } as never,
    });
  } catch (err) {
    console.error("flw_webhook persist event failed", err);
  }
}

function log(event: string, fields: Record<string, unknown>) {
  console.log("flw_webhook " + JSON.stringify({ event, ts: new Date().toISOString(), ...fields }));
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export const Route = createFileRoute("/api/public/hooks/flutterwave")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expectedHash = process.env.FLUTTERWAVE_WEBHOOK_HASH;
        const secret = process.env.FLUTTERWAVE_SECRET_KEY;
        if (!expectedHash || !secret) {
          log("config_missing", {});
          return new Response("Webhook not configured", { status: 500 });
        }

        const incomingHash = request.headers.get("verif-hash") ?? request.headers.get("Verif-Hash") ?? "";
        if (!incomingHash || !safeEqual(incomingHash, expectedHash)) {
          log("invalid_signature", { incoming_length: incomingHash.length });
          return new Response("Invalid signature", { status: 401 });
        }

        const bodyText = await request.text();
        let payload: {
          event?: string;
          data?: {
            id?: number | string;
            tx_ref?: string;
            status?: string;
            amount?: number;
            currency?: string;
          };
        } = {};
        try {
          payload = JSON.parse(bodyText);
        } catch {
          log("invalid_json", {});
          return new Response("Invalid JSON", { status: 400 });
        }

        const txId = payload.data?.id ? String(payload.data.id) : null;
        const txRef = payload.data?.tx_ref ?? null;
        log("received", { event: payload.event, tx_ref: txRef, tx_id: txId, status: payload.data?.status });

        if (!txId || !txRef) {
          return new Response("ok", { status: 200 });
        }

        // Always re-verify with Flutterwave — never trust the webhook payload alone.
        const verifyResp = await fetch(`${FLW_API}/transactions/${encodeURIComponent(txId)}/verify`, {
          headers: { Authorization: `Bearer ${secret}` },
        });
        const verify = (await verifyResp.json()) as {
          status: string;
          message?: string;
          data?: { status: string; amount: number; currency: string; tx_ref: string };
        };

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: payment, error: payErr } = await supabaseAdmin
          .from("payments")
          .select("*")
          .eq("tx_ref", txRef)
          .maybeSingle();

        if (payErr || !payment) {
          await persistEvent("payment_not_found", {
            tx_ref: txRef,
            payment_id: null,
            error: payErr?.message ?? "no row",
          });
          return new Response("ok", { status: 200 });
        }

        const tx = verify?.data;
        const ok =
          verifyResp.ok &&
          verify.status === "success" &&
          tx?.status === "successful" &&
          tx.tx_ref === payment.tx_ref &&
          tx.currency === payment.currency &&
          Number(tx.amount) >= Number(payment.amount);

        if (!ok) {
          await persistEvent("flw_verify_failed", {
            tx_ref: txRef,
            payment_id: payment.id,
            user_id: payment.user_id,
            plan_tier: payment.plan_tier,
            flw_status: verify.status,
            flw_message: verify.message,
            flw_tx_status: tx?.status,
            source: "webhook",
          });
          return new Response("ok", { status: 200 });
        }

        // Snapshot profile to decide whether activation is still needed.
        const { data: profileBefore } = await supabaseAdmin
          .from("profiles")
          .select("plan, plan_tier, pro_expires_at")
          .eq("id", payment.user_id)
          .maybeSingle();

        const alreadyPro =
          profileBefore?.plan === "pro" &&
          profileBefore?.plan_tier === payment.plan_tier &&
          profileBefore?.pro_expires_at &&
          new Date(profileBefore.pro_expires_at as string) > new Date();

        if (payment.status === "successful" && alreadyPro) {
          await persistEvent("already_verified", {
            tx_ref: txRef,
            payment_id: payment.id,
            user_id: payment.user_id,
            plan_tier: payment.plan_tier,
            source: "webhook",
          });
          return new Response("ok", { status: 200 });
        }

        // Activate (idempotent — RPC just overwrites the same fields).
        const { error: rpcErr } = await supabaseAdmin.rpc("activate_pro_plan", {
          _user_id: payment.user_id,
          _plan_tier: payment.plan_tier,
          _days: 30,
        });
        if (rpcErr) {
          await persistEvent("activate_pro_plan_failed", {
            tx_ref: txRef,
            payment_id: payment.id,
            user_id: payment.user_id,
            plan_tier: payment.plan_tier,
            last_known_plan: profileBefore?.plan,
            last_known_plan_tier: profileBefore?.plan_tier,
            rpc_error: rpcErr.message,
            source: "webhook",
          });
          return new Response("ok", { status: 200 });
        }

        // Read back the profile to confirm the RPC actually landed.
        const { data: profileAfter } = await supabaseAdmin
          .from("profiles")
          .select("plan, plan_tier, pro_expires_at")
          .eq("id", payment.user_id)
          .maybeSingle();

        if (payment.status !== "successful") {
          await supabaseAdmin
            .from("payments")
            .update({
              status: "successful",
              flw_transaction_id: txId,
              flw_response: JSON.parse(JSON.stringify(verify)),
              verified_at: new Date().toISOString(),
            })
            .eq("id", payment.id);
        }

        const eventName = payment.status === "successful"
          ? "activation_recovered_via_webhook"
          : "activation_complete";

        await persistEvent(eventName, {
          tx_ref: txRef,
          payment_id: payment.id,
          user_id: payment.user_id,
          plan_tier: payment.plan_tier,
          last_known_plan: profileBefore?.plan,
          last_known_plan_tier: profileBefore?.plan_tier,
          profile_after_plan: profileAfter?.plan,
          profile_after_plan_tier: profileAfter?.plan_tier,
          source: "webhook",
        });

        return new Response("ok", { status: 200 });
      },
    },
  },
});
