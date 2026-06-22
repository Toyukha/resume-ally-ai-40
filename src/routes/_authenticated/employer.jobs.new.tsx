import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useEmployerCtx } from "./employer";
import { JobForm, emptyJobForm, type JobFormState } from "@/components/employer/job-form";
import { createJob } from "@/lib/employer/employer-jobs.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/employer/jobs/new")({
  head: () => ({ meta: [{ title: "Post a job — Employer" }] }),
  component: NewJob,
});

function formToPayload(companyId: string, f: JobFormState, publish: boolean) {
  return {
    companyId,
    title: f.title,
    department: f.department || undefined,
    employmentType: f.employmentType,
    workMode: f.workMode,
    location: f.location || undefined,
    salaryMin: f.salaryMin ? Number(f.salaryMin) : undefined,
    salaryMax: f.salaryMax ? Number(f.salaryMax) : undefined,
    currency: f.currency || "USD",
    description: f.description,
    responsibilities: f.responsibilities || undefined,
    requiredSkills: f.requiredSkills,
    preferredSkills: f.preferredSkills,
    experienceLevel: f.experienceLevel || undefined,
    education: f.education || undefined,
    vacancies: Number(f.vacancies) || 1,
    deadline: f.deadline || undefined,
    applyMode: f.applyMode,
    externalUrl: f.applyMode === "external" ? f.externalUrl : undefined,
    publish,
  };
}

function NewJob() {
  const { activeCompanyId } = useEmployerCtx();
  const [form, setForm] = useState<JobFormState>(emptyJobForm);
  const navigate = useNavigate();
  const fn = useServerFn(createJob);
  const m = useMutation({
    mutationFn: (publish: boolean) => fn({ data: formToPayload(activeCompanyId, form, publish) }),
    onSuccess: () => { toast.success("Job saved"); navigate({ to: "/employer/jobs" }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="font-display text-2xl font-bold">Post a new job</h1>
      <JobForm
        value={form}
        onChange={setForm}
        onSubmit={() => m.mutate(true)}
        onSaveDraft={() => m.mutate(false)}
        submitLabel="Publish job"
        isPending={m.isPending}
      />
    </div>
  );
}
