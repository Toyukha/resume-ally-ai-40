import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export type JobFormState = {
  title: string;
  department: string;
  employmentType: "full_time" | "part_time" | "contract" | "internship" | "temporary";
  workMode: "remote" | "hybrid" | "onsite";
  location: string;
  salaryMin: string;
  salaryMax: string;
  currency: string;
  description: string;
  responsibilities: string;
  requiredSkills: string[];
  preferredSkills: string[];
  experienceLevel: string;
  education: string;
  vacancies: string;
  deadline: string;
  applyMode: "in_app" | "external";
  externalUrl: string;
};

export const emptyJobForm: JobFormState = {
  title: "", department: "", employmentType: "full_time", workMode: "onsite", location: "",
  salaryMin: "", salaryMax: "", currency: "USD", description: "", responsibilities: "",
  requiredSkills: [], preferredSkills: [], experienceLevel: "", education: "",
  vacancies: "1", deadline: "", applyMode: "in_app", externalUrl: "",
};

export function JobForm({
  value, onChange, onSubmit, submitLabel, onSaveDraft, isPending,
}: {
  value: JobFormState;
  onChange: (v: JobFormState) => void;
  onSubmit: () => void;
  onSaveDraft?: () => void;
  submitLabel: string;
  isPending?: boolean;
}) {
  return (
    <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <Section title="Basics">
        <Row>
          <Field label="Job title *" className="md:col-span-2">
            <Input value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} placeholder="Senior Frontend Engineer" />
          </Field>
          <Field label="Department">
            <Input value={value.department} onChange={(e) => onChange({ ...value, department: e.target.value })} placeholder="Engineering" />
          </Field>
        </Row>
        <Row>
          <Field label="Employment type">
            <Select value={value.employmentType} onChange={(v) => onChange({ ...value, employmentType: v as JobFormState["employmentType"] })}
              options={[["full_time","Full-time"],["part_time","Part-time"],["contract","Contract"],["internship","Internship"],["temporary","Temporary"]]} />
          </Field>
          <Field label="Work mode">
            <Select value={value.workMode} onChange={(v) => onChange({ ...value, workMode: v as JobFormState["workMode"] })}
              options={[["onsite","Onsite"],["hybrid","Hybrid"],["remote","Remote"]]} />
          </Field>
          <Field label="Location">
            <Input value={value.location} onChange={(e) => onChange({ ...value, location: e.target.value })} placeholder="Lagos, Nigeria" />
          </Field>
        </Row>
        <Row>
          <Field label="Salary min">
            <Input type="number" value={value.salaryMin} onChange={(e) => onChange({ ...value, salaryMin: e.target.value })} placeholder="50000" />
          </Field>
          <Field label="Salary max">
            <Input type="number" value={value.salaryMax} onChange={(e) => onChange({ ...value, salaryMax: e.target.value })} placeholder="80000" />
          </Field>
          <Field label="Currency">
            <Input value={value.currency} onChange={(e) => onChange({ ...value, currency: e.target.value.toUpperCase() })} maxLength={3} />
          </Field>
        </Row>
      </Section>

      <Section title="Description">
        <Field label="Job description *">
          <Textarea rows={6} value={value.description} onChange={(e) => onChange({ ...value, description: e.target.value })}
            placeholder="Describe the role, mission, and impact." />
        </Field>
        <Field label="Responsibilities">
          <Textarea rows={4} value={value.responsibilities} onChange={(e) => onChange({ ...value, responsibilities: e.target.value })}
            placeholder="One bullet per line." />
        </Field>
      </Section>

      <Section title="Requirements">
        <Row>
          <Field label="Experience level">
            <Input value={value.experienceLevel} onChange={(e) => onChange({ ...value, experienceLevel: e.target.value })} placeholder="3-5 years" />
          </Field>
          <Field label="Education">
            <Input value={value.education} onChange={(e) => onChange({ ...value, education: e.target.value })} placeholder="Bachelor's degree" />
          </Field>
          <Field label="Vacancies">
            <Input type="number" min={1} value={value.vacancies} onChange={(e) => onChange({ ...value, vacancies: e.target.value })} />
          </Field>
        </Row>
        <Field label="Required skills">
          <SkillsEditor value={value.requiredSkills} onChange={(v) => onChange({ ...value, requiredSkills: v })} placeholder="Add a required skill (press Enter)" />
        </Field>
        <Field label="Preferred skills">
          <SkillsEditor value={value.preferredSkills} onChange={(v) => onChange({ ...value, preferredSkills: v })} placeholder="Add a nice-to-have skill" />
        </Field>
      </Section>

      <Section title="Posting">
        <Row>
          <Field label="Application deadline">
            <Input type="date" value={value.deadline} onChange={(e) => onChange({ ...value, deadline: e.target.value })} />
          </Field>
          <Field label="How to apply">
            <Select value={value.applyMode} onChange={(v) => onChange({ ...value, applyMode: v as JobFormState["applyMode"] })}
              options={[["in_app","Collect applications in-app (with AI ATS)"],["external","Redirect to external URL"]]} />
          </Field>
          {value.applyMode === "external" && (
            <Field label="External URL">
              <Input value={value.externalUrl} onChange={(e) => onChange({ ...value, externalUrl: e.target.value })} placeholder="https://…" />
            </Field>
          )}
        </Row>
      </Section>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="hero" disabled={isPending}>{isPending ? "Saving…" : submitLabel}</Button>
        {onSaveDraft && (
          <Button type="button" variant="outline" onClick={onSaveDraft} disabled={isPending}>Save as draft</Button>
        )}
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-card-gradient p-5">
      <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-3">{children}</div>;
}
function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
      {options.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
    </select>
  );
}
function SkillsEditor({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (!v) return;
    if (value.includes(v)) { setInput(""); return; }
    onChange([...value, v]);
    setInput("");
  };
  return (
    <div className="space-y-2">
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
        onBlur={add}
        placeholder={placeholder}
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((s) => (
            <Badge key={s} variant="secondary" className="gap-1">
              {s}
              <button type="button" onClick={() => onChange(value.filter((x) => x !== s))}><X className="h-3 w-3" /></button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
