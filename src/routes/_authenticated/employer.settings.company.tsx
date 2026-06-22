import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useEmployerCtx } from "./employer";
import { getCompany, updateCompany } from "@/lib/employer/companies.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/employer/settings/company")({
  head: () => ({ meta: [{ title: "Company settings — Employer" }] }),
  component: CompanySettings,
});

function CompanySettings() {
  const { activeCompanyId, role } = useEmployerCtx();
  const isAdmin = role === "admin";
  const qc = useQueryClient();
  const getFn = useServerFn(getCompany);
  const updFn = useServerFn(updateCompany);
  const { data } = useQuery({ queryKey: ["company", activeCompanyId], queryFn: () => getFn({ data: { id: activeCompanyId } }) });
  const [form, setForm] = useState({ name: "", industry: "", website: "", size: "", hqLocation: "", contactEmail: "", description: "" });

  useEffect(() => {
    if (!data) return;
    setForm({
      name: data.name ?? "",
      industry: data.industry ?? "",
      website: data.website ?? "",
      size: data.size ?? "",
      hqLocation: data.hq_location ?? "",
      contactEmail: data.contact_email ?? "",
      description: data.description ?? "",
    });
  }, [data]);

  const m = useMutation({
    mutationFn: () => updFn({ data: { id: activeCompanyId, ...form } }),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["company", activeCompanyId] }); qc.invalidateQueries({ queryKey: ["my-companies"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="font-display text-2xl font-bold">Company settings</h1>
      <Card className="bg-card-gradient p-5">
        <div className="space-y-4">
          <div><Label className="text-xs">Name</Label><Input disabled={!isAdmin} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label className="text-xs">Industry</Label><Input disabled={!isAdmin} value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} /></div>
            <div><Label className="text-xs">Company size</Label><Input disabled={!isAdmin} value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} /></div>
            <div><Label className="text-xs">HQ location</Label><Input disabled={!isAdmin} value={form.hqLocation} onChange={(e) => setForm({ ...form, hqLocation: e.target.value })} /></div>
            <div><Label className="text-xs">Website</Label><Input disabled={!isAdmin} value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
            <div className="md:col-span-2"><Label className="text-xs">Contact email</Label><Input disabled={!isAdmin} value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} /></div>
          </div>
          <div><Label className="text-xs">About</Label><Textarea disabled={!isAdmin} rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          {isAdmin && <Button variant="hero" onClick={() => m.mutate()} disabled={m.isPending}>{m.isPending ? "Saving…" : "Save changes"}</Button>}
        </div>
      </Card>
    </div>
  );
}
