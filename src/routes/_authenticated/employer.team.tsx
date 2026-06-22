import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Copy, Trash2, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useEmployerCtx } from "./employer";
import { listMembers, inviteMember, revokeInvite, removeMember } from "@/lib/employer/members.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/employer/team")({
  head: () => ({ meta: [{ title: "Team — Employer" }] }),
  component: TeamPage,
});

function TeamPage() {
  const { activeCompanyId, role } = useEmployerCtx();
  const isAdmin = role === "admin";
  const qc = useQueryClient();
  const listFn = useServerFn(listMembers);
  const invFn = useServerFn(inviteMember);
  const revFn = useServerFn(revokeInvite);
  const rmFn = useServerFn(removeMember);

  const { data } = useQuery({ queryKey: ["company-members", activeCompanyId], queryFn: () => listFn({ data: { companyId: activeCompanyId } }) });
  const [email, setEmail] = useState("");
  const [memberRole, setMemberRole] = useState<"admin" | "recruiter" | "hiring_manager">("recruiter");

  const invM = useMutation({
    mutationFn: () => invFn({ data: { companyId: activeCompanyId, email, role: memberRole } }),
    onSuccess: (r) => {
      const url = `${window.location.origin}/employer/invite/${r.token}`;
      navigator.clipboard.writeText(url).catch(() => {});
      toast.success("Invite created — link copied to clipboard");
      setEmail("");
      qc.invalidateQueries({ queryKey: ["company-members", activeCompanyId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold">Team</h1>

      {isAdmin && (
        <Card className="bg-card-gradient p-5">
          <h2 className="mb-3 font-display font-semibold">Invite a teammate</h2>
          <div className="flex flex-wrap gap-2">
            <Input className="flex-1 min-w-[200px]" type="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <select value={memberRole} onChange={(e) => setMemberRole(e.target.value as any)} className="h-10 rounded-md border border-border bg-background px-3 text-sm">
              <option value="recruiter">Recruiter</option>
              <option value="hiring_manager">Hiring manager</option>
              <option value="admin">Admin</option>
            </select>
            <Button variant="hero" onClick={() => invM.mutate()} disabled={!email || invM.isPending}>
              <UserPlus className="mr-1.5 h-4 w-4" /> Invite
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">We'll generate an invite link you can share. They can accept it after signing in.</p>
        </Card>
      )}

      <Card className="bg-card-gradient p-5">
        <h2 className="mb-3 font-display font-semibold">Members</h2>
        <ul className="space-y-2">
          {(data?.members ?? []).map((m) => (
            <li key={m.id} className="flex items-center justify-between rounded border border-border/60 p-3 text-sm">
              <div>
                <div className="font-mono text-xs">{m.user_id}</div>
                <Badge variant="outline" className="mt-1 capitalize">{m.role.replace("_", " ")}</Badge>
              </div>
              {isAdmin && (
                <Button size="sm" variant="ghost" onClick={() => { if (confirm("Remove member?")) rmFn({ data: { id: m.id } }).then(() => qc.invalidateQueries({ queryKey: ["company-members", activeCompanyId] })); }}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              )}
            </li>
          ))}
        </ul>
        {(data?.invites?.length ?? 0) > 0 && (
          <>
            <h3 className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending invites</h3>
            <ul className="space-y-2">
              {data!.invites.map((i) => {
                const url = `${typeof window !== "undefined" ? window.location.origin : ""}/employer/invite/${i.token}`;
                return (
                  <li key={i.id} className="flex items-center justify-between rounded border border-border/60 p-3 text-sm">
                    <div>
                      <div>{i.email}</div>
                      <div className="text-[11px] text-muted-foreground">Expires {new Date(i.expires_at).toLocaleDateString()} · {i.role.replace("_", " ")}</div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(url); toast.success("Link copied"); }}><Copy className="h-3.5 w-3.5" /></Button>
                      {isAdmin && <Button size="sm" variant="ghost" onClick={() => revFn({ data: { id: i.id } }).then(() => qc.invalidateQueries({ queryKey: ["company-members", activeCompanyId] }))}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Card>
    </div>
  );
}
