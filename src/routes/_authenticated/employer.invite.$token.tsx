import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { acceptInvite } from "@/lib/employer/members.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/employer/invite/$token")({
  head: () => ({ meta: [{ title: "Accept invite — Employer" }] }),
  component: AcceptInvitePage,
});

function AcceptInvitePage() {
  const { token } = useParams({ from: "/_authenticated/employer/invite/$token" });
  const fn = useServerFn(acceptInvite);
  const navigate = useNavigate();
  const m = useMutation({
    mutationFn: () => fn({ data: { token } }),
    onSuccess: (r) => {
      toast.success("You're in!");
      localStorage.setItem("activeCompanyId", r.companyId);
      navigate({ to: "/employer/dashboard" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Invite invalid"),
  });
  useEffect(() => { m.mutate(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  return (
    <div className="grid min-h-[40vh] place-items-center">
      <Card className="bg-card-gradient p-8 text-center">
        {m.isPending && <p>Joining workspace…</p>}
        {m.isError && (
          <>
            <p className="mb-3 text-sm text-destructive">{(m.error as Error)?.message}</p>
            <Button onClick={() => m.mutate()}>Try again</Button>
          </>
        )}
      </Card>
    </div>
  );
}
