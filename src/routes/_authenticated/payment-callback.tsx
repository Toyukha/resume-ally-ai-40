import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/navbar";
import { verifyFlutterwavePayment } from "@/lib/flutterwave.functions";
import { getUserPlan } from "@/lib/analyze.functions";
import { z } from "zod";

const SearchSchema = z.object({
  status: z.string().optional(),
  tx_ref: z.string().optional(),
  transaction_id: z.union([z.string(), z.number()]).optional().transform((v) => (v === undefined ? undefined : String(v))),
});

export const Route = createFileRoute("/_authenticated/payment-callback")({
  validateSearch: (s) => SearchSchema.parse(s),
  component: CallbackPage,
});

type State =
  | { kind: "verifying" }
  | { kind: "success"; planTier: string }
  | { kind: "error"; message: string }
  | { kind: "timeout"; planTier: string };

function CallbackPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const verify = useServerFn(verifyFlutterwavePayment);
  const fetchPlan = useServerFn(getUserPlan);
  const [state, setState] = useState<State>({ kind: "verifying" });
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (search.status === "cancelled") {
      setState({ kind: "error", message: "Payment was cancelled. You can try again any time." });
      return;
    }
    if (!search.tx_ref || !search.transaction_id) {
      setState({ kind: "error", message: "Missing payment details from the gateway." });
      return;
    }

    (async () => {
      const startedAt = Date.now();
      const elapsed = () => Date.now() - startedAt;
      const txRef = search.tx_ref!;
      const txId = search.transaction_id!;
      // Last known plan captured from each poll, surfaced in failure logs.
      let lastKnownPlan: string | null = null;
      let lastKnownPlanTier: string | null = null;
      let userId: string | null = null;

      const log = (event: string, extra: Record<string, unknown> = {}) => {
        console.log(
          "flw_callback " +
            JSON.stringify({
              event,
              ts: new Date().toISOString(),
              tx_ref: txRef,
              transaction_id: txId,
              user_id: userId,
              last_known_plan: lastKnownPlan,
              last_known_plan_tier: lastKnownPlanTier,
              elapsed_ms: elapsed(),
              ...extra,
            }),
        );
      };

      try {
        log("verify_request");
        const r = await verify({ data: { tx_ref: txRef, transaction_id: txId } });
        log("verify_response", { plan_tier: r.planTier, already_verified: r.alreadyVerified });

        // Poll the user-plan until it reflects Pro (up to ~30 s).
        let confirmed = false;
        for (let i = 0; i < 20; i++) {
          const plan = await fetchPlan().catch((err) => {
            log("fetch_plan_error", { attempt: i + 1, error: err instanceof Error ? err.message : String(err) });
            return null;
          });
          if (plan) {
            lastKnownPlan = plan.plan ?? null;
            lastKnownPlanTier = plan.planTier ?? null;
            userId = plan.userId ?? userId;
          }
          if (plan?.plan === "pro") {
            confirmed = true;
            log("plan_confirmed", { attempt: i + 1 });
            break;
          }
          await new Promise((res) => setTimeout(res, 1500));
        }

        await queryClient.invalidateQueries();
        await router.invalidate();

        if (!confirmed) {
          log("activation_timeout", { plan_tier: r.planTier });
          setState({ kind: "timeout", planTier: r.planTier });
          return;
        }

        log("activation_success", { plan_tier: r.planTier });
        setState({ kind: "success", planTier: r.planTier });

        // Auto-redirect to dashboard after a brief moment so the user sees the success state.
        setTimeout(() => {
          navigate({ to: "/dashboard", search: { upgraded: 1 } as never });
        }, 1500);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Verification failed";
        log("verify_exception", { error: message });
        setState({ kind: "error", message });
      }
    })();
  }, [search, verify, fetchPlan, queryClient, router, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto flex max-w-xl flex-col items-center px-4 py-24">
        <Card className="w-full p-10 text-center">
          {state.kind === "verifying" && (
            <>
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary-glow" />
              <h1 className="mt-6 font-display text-2xl font-semibold">Verifying your payment…</h1>
              <p className="mt-2 text-sm text-muted-foreground">Hang tight — this only takes a moment.</p>
            </>
          )}
          {state.kind === "success" && (
            <>
              <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
              <h1 className="mt-6 font-display text-2xl font-semibold">You're all set!</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Your {state.planTier === "pro_2" ? "Pro Plan 2" : "Pro Plan 1"} subscription is now active for the next 30 days.
              </p>
              <Button className="mt-8" variant="hero" onClick={() => navigate({ to: "/dashboard" })}>
                Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}
          {state.kind === "error" && (
            <>
              <XCircle className="mx-auto h-12 w-12 text-destructive" />
              <h1 className="mt-6 font-display text-2xl font-semibold">Something went wrong</h1>
              <p className="mt-2 text-sm text-muted-foreground">{state.message}</p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Button variant="outline" asChild>
                  <Link to="/dashboard">Back to dashboard</Link>
                </Button>
                <Button variant="hero" asChild>
                  <Link to="/pricing">Try again</Link>
                </Button>
              </div>
            </>
          )}
          {state.kind === "timeout" && (
            <>
              <XCircle className="mx-auto h-12 w-12 text-amber-500" />
              <h1 className="mt-6 font-display text-2xl font-semibold">We couldn&apos;t confirm your upgrade</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Your payment was received, but we couldn&apos;t activate your {state.planTier === "pro_2" ? "Pro Plan 2" : "Pro Plan 1"} within 30 seconds.
                Don&apos;t worry — your transaction is safe.
              </p>
              <div className="mt-6 rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
                <p className="font-medium">What to do next:</p>
                <ul className="mt-1 list-inside list-disc space-y-1 text-left">
                  <li>Check your dashboard — the plan may already be active.</li>
                  <li>If not, tap <strong>Retry activation</strong> to try again.</li>
                  <li>Still stuck? Reach out via <strong>Support</strong> and we&apos;ll fix it immediately.</li>
                </ul>
              </div>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Button variant="outline" asChild>
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
                <Button variant="hero" onClick={() => window.location.reload()}>
                  Retry Activation
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/support">Contact Support</Link>
                </Button>
              </div>
            </>
          )}
        </Card>
      </main>
    </div>
  );
}
