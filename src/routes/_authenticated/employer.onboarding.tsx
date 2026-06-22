import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Building2, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createCompany } from "@/lib/employer/companies.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/employer/onboarding")({
  head: () => ({ meta: [{ title: "Set up your company — Career Boost" }] }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const createFn = useServerFn(createCompany);
  const [form, setForm] = useState({ name: "", industry: "", website: "", size: "", hqLocation: "", contactEmail: "", description: "" });

  const m = useMutation({
    mutationFn: () => createFn({ data: form }),
    onSuccess: (r) => {
      toast.success("Company created");
      localStorage.setItem("activeCompanyId", r.id);
      navigate({ to: "/employer/dashboard" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-hero shadow-glow">
          <Building2 className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="font-display text-3xl font-bold">Set up your company</h1>
        <p className="mt-1 text-muted-foreground">Tell us a bit about who's hiring. You can edit this later.</p>
      </div>
      <Card className="bg-card-gradient p-6">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (form.name.trim().length < 2) return toast.error("Company name is required");
            m.mutate();
          }}
        >
          <Field label="Company name *">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Acme Talent Co." />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Industry">
              <Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="SaaS, NGO, Fintech…" />
            </Field>
            <Field label="Company size">
              <select
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="">Select…</option>
                <option value="1-10">1-10</option>
                <option value="11-50">11-50</option>
                <option value="51-200">51-200</option>
                <option value="201-500">201-500</option>
                <option value="500+">500+</option>
              </select>
            </Field>
            <Field label="Headquarters">
              <Input value={form.hqLocation} onChange={(e) => setForm({ ...form, hqLocation: e.target.value })} placeholder="Lagos, Nigeria" />
            </Field>
            <Field label="Website">
              <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://…" />
            </Field>
            <Field label="Contact email">
              <Input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} placeholder="hiring@yourcompany.com" />
            </Field>
          </div>
          <Field label="About the company">
            <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="One paragraph candidates will see on every job." />
          </Field>
          <Button type="submit" variant="hero" className="w-full" disabled={m.isPending}>
            {m.isPending ? "Creating…" : <><Sparkles className="mr-2 h-4 w-4" /> Create company workspace</>}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
