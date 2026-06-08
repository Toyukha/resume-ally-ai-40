import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Search, Loader2, MoreHorizontal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listAllUsers, setUserSuspended, deleteUser, setUserPlan, resetUserPassword } from "@/lib/admin.functions";
import { getAdminMe } from "@/lib/admin.functions";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Users — Admin" }] }),
  component: UsersPage,
});

function UsersPage() {
  const [q, setQ] = useState("");
  const qc = useQueryClient();
  const listFn = useServerFn(listAllUsers);
  const meFn = useServerFn(getAdminMe);
  const meQ = useQuery({ queryKey: ["admin-me"], queryFn: () => meFn() });
  const isSuper = !!meQ.data?.roles.includes("super_admin");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-users", q],
    queryFn: () => listFn({ data: { search: q || undefined } }),
  });

  const suspendFn = useServerFn(setUserSuspended);
  const deleteFn = useServerFn(deleteUser);
  const planFn = useServerFn(setUserPlan);
  const resetFn = useServerFn(resetUserPassword);

  const onAction = (action: () => Promise<unknown>, success: string) => {
    return useMutation({
      mutationFn: action,
      onSuccess: () => { toast.success(success); qc.invalidateQueries({ queryKey: ["admin-users"] }); refetch(); },
      onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">User Management</h1>
        <p className="text-sm text-muted-foreground">View, search, suspend, upgrade, or delete user accounts.</p>
      </div>

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by email or user ID…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-10 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading users…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Email</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Roles</th>
                  <th className="p-3">Analyses</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Joined</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map((u) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-medium">{u.email || u.id.slice(0, 8)}</td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <Badge variant={u.plan === "pro" ? "default" : "secondary"}>
                          {u.plan_tier === "pro_1" ? "Pro 1"
                            : u.plan_tier === "pro_2" ? "Pro 2"
                            : u.plan_tier === "pro_legacy" ? "Pro (legacy)"
                            : u.plan === "pro" ? "Pro"
                            : "Free"}
                        </Badge>
                        {u.pro_expires_at && u.plan === "pro" && (
                          <span className="text-[10px] text-muted-foreground">
                            exp {new Date(u.pro_expires_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.length === 0 ? <span className="text-muted-foreground">—</span> :
                          u.roles.map((r) => <span key={r} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{r}</span>)}
                      </div>
                    </td>
                    <td className="p-3 tabular-nums">{u.analyses}</td>
                    <td className="p-3">
                      {u.suspended ? <Badge variant="destructive">Suspended</Badge> : <Badge variant="outline">Active</Badge>}
                    </td>
                    <td className="p-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      {isSuper ? (
                        <UserActions
                          user={u}
                          onSuspend={() => suspendFn({ data: { userId: u.id, suspended: !u.suspended } })
                            .then(() => { toast.success(u.suspended ? "User reactivated" : "User suspended"); refetch(); })
                            .catch((e) => toast.error(e.message))}
                          onPlan={(planTier) => planFn({ data: { userId: u.id, planTier, months: planTier === "free" ? undefined : 1 } })
                            .then(() => { toast.success(`Plan set to ${planTier}`); qc.invalidateQueries({ queryKey: ["user-plan"] }); refetch(); })
                            .catch((e) => toast.error(e.message))}
                          onReset={() => u.email && resetFn({ data: { email: u.email } })
                            .then(() => toast.success("Password reset email sent"))
                            .catch((e) => toast.error(e.message))}
                          onDelete={() => { if (confirm(`Delete ${u.email}? This cannot be undone.`)) {
                            deleteFn({ data: { userId: u.id } })
                              .then(() => { toast.success("User deleted"); refetch(); })
                              .catch((e) => toast.error(e.message));
                          }}}
                        />
                      ) : <span className="text-xs text-muted-foreground">view only</span>}
                    </td>
                  </tr>
                ))}
                {data && data.length === 0 && (
                  <tr><td colSpan={7} className="p-10 text-center text-muted-foreground">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function UserActions({ user, onSuspend, onPlan, onReset, onDelete }: {
  user: { suspended: boolean; plan: string; plan_tier: string };
  onSuspend: () => void;
  onPlan: (planTier: "free" | "pro_1" | "pro_2") => void;
  onReset: () => void;
  onDelete: () => void;
}) {
  const isPro = user.plan === "pro";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {user.plan_tier !== "pro_1" && (
          <DropdownMenuItem onClick={() => onPlan("pro_1")}>
            Upgrade to Pro Plan 1 (30 days)
          </DropdownMenuItem>
        )}
        {user.plan_tier !== "pro_2" && (
          <DropdownMenuItem onClick={() => onPlan("pro_2")}>
            Upgrade to Pro Plan 2 (30 days)
          </DropdownMenuItem>
        )}
        {isPro && (
          <DropdownMenuItem onClick={() => onPlan("free")} className="text-destructive">
            Downgrade to Free
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onReset}>Send password reset</DropdownMenuItem>
        <DropdownMenuItem onClick={onSuspend}>{user.suspended ? "Reactivate" : "Suspend"}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="text-destructive">Delete user</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
