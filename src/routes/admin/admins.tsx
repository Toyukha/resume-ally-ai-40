import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Trash2, UserPlus, PauseCircle, PlayCircle } from "lucide-react";
import { addAdmin, getAdminMe, listAdmins, removeAdmin, setAdminSuspended } from "@/lib/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/admins")({
  head: () => ({ meta: [{ title: "Admins — Admin" }] }),
  component: AdminsPage,
});

const ROLE_OPTIONS = ["super_admin", "admin", "support_admin", "analytics_admin"] as const;

function AdminsPage() {
  const qc = useQueryClient();
  const meFn = useServerFn(getAdminMe);
  const meQ = useQuery({ queryKey: ["admin-me"], queryFn: () => meFn() });
  const isSuper = !!meQ.data?.roles.includes("super_admin");

  const listFn = useServerFn(listAdmins);
  const { data } = useQuery({ queryKey: ["admins"], queryFn: () => listFn() });

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof ROLE_OPTIONS)[number]>("admin");
  const addFn = useServerFn(addAdmin);
  const removeFn = useServerFn(removeAdmin);
  const suspendFn = useServerFn(setAdminSuspended);

  const add = useMutation({
    mutationFn: () => addFn({ data: { email, role } }),
    onSuccess: () => { toast.success("Admin added"); setEmail(""); qc.invalidateQueries({ queryKey: ["admins"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">Admin Management</h1>
        <p className="text-sm text-muted-foreground">
          {isSuper ? "Add, suspend, or remove admin accounts." : "View admins (super_admin required to manage)."}
        </p>
      </div>

      {isSuper && (
        <Card className="p-5">
          <h3 className="mb-3 font-semibold flex items-center gap-2"><UserPlus className="h-4 w-4" />Add new admin</h3>
          <form onSubmit={(e) => { e.preventDefault(); add.mutate(); }} className="grid gap-3 md:grid-cols-[1fr_200px_auto]">
            <div>
              <Label htmlFor="email">Email (user must have an account)</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={add.isPending} className="w-full md:w-auto">
                {add.isPending ? "Adding…" : "Add admin"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3">Added</th><th className="p-3 text-right">Actions</th></tr>
            </thead>
            <tbody>
              {(data ?? []).map((a) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{a.email}</td>
                  <td className="p-3"><Badge>{a.role}</Badge></td>
                  <td className="p-3">{a.suspended ? <Badge variant="destructive">Suspended</Badge> : <Badge variant="outline">Active</Badge>}</td>
                  <td className="p-3 text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</td>
                  <td className="p-3 text-right">
                    {isSuper ? (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => suspendFn({ data: { id: a.id, suspended: !a.suspended } })
                          .then(() => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admins"] }); })
                          .catch((e) => toast.error(e.message))}>
                          {a.suspended ? <><PlayCircle className="mr-1 h-3 w-3" />Reactivate</> : <><PauseCircle className="mr-1 h-3 w-3" />Suspend</>}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => {
                          if (confirm(`Remove ${a.role} role from ${a.email}?`)) {
                            removeFn({ data: { id: a.id } })
                              .then(() => { toast.success("Removed"); qc.invalidateQueries({ queryKey: ["admins"] }); })
                              .catch((e) => toast.error(e.message));
                          }
                        }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : <span className="text-xs text-muted-foreground">view only</span>}
                  </td>
                </tr>
              ))}
              {data && data.length === 0 && (
                <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">No admins yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
