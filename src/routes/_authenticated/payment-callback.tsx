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
  | { kind: "error"; message: string };

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
      try {
        const r = await verify({ data: { tx_ref: search.tx_ref!, transaction_id: search.transaction_id! } });

        // Poll the user-plan until it reflects Pro (handles any replication lag).
        for (let i = 0; i < 8; i++) {
          const plan = await fetchPlan().catch(() => null);
          if (plan?.plan === "pro") break;
          await new Promise((res) => setTimeout(res, 1200));
        }

        await queryClient.invalidateQueries();
        await router.invalidate();
        setState({ kind: "success", planTier: r.planTier });

        // Auto-redirect to dashboard after a brief moment so the user sees the success state.
        setTimeout(() => {
          navigate({ to: "/dashboard", search: { upgraded: 1 } as never });
        }, 1500);
      } catch (e) {
        setState({ kind: "error", message: e instanceof Error ? e.message : "Verification failed" });
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
        </Card>
      </main>
    </div>
  );
}
