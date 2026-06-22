import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { useEmployerCtx } from "./employer";
import { JobForm, emptyJobForm, type JobFormState } from "@/components/employer/job-form";
import { getJobForEdit, updateJob } from "@/lib/employer/employer-jobs.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/employer/jobs/$id/edit")({
  head: () => ({ meta: [{ title: "Edit job — Employer" }] }),
  component: EditJob,
});

function EditJob() {
  const { id } = useParams({ from: "/_authenticated/employer/jobs/$id/edit" });
  const { activeCompanyId } = useEmployerCtx();
  const getFn = useServerFn(getJobForEdit);
  const updFn = useServerFn(updateJob);
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["employer-job", id], queryFn: () => getFn({ data: { id } }) });
  const [form, setForm] = useState<JobFormState>(emptyJobForm);

  useEffect(() => {
    if (!data) return;
    setForm({
      title: data.title, department: data.department ?? "",
      employmentType: data.employment_type, workMode: data.work_mode,
      location: data.location ?? "",
      salaryMin: data.salary_min?.toString() ?? "",
      salaryMax: data.salary_max?.toString() ?? "",
      currency: data.currency,
      description: data.description, responsibilities: data.responsibilities ?? "",
      requiredSkills: data.required_skills ?? [],
      preferredSkills: data.preferred_skills ?? [],
      experienceLevel: data.experience_level ?? "",
      education: data.education ?? "",
      vacancies: String(data.vacancies),
      deadline: data.deadline ?? "",
      applyMode: data.apply_mode,
      externalUrl: data.external_url ?? "",
    });
  }, [data]);

  const m = useMutation({
    mutationFn: () => updFn({ data: {
      id,
      companyId: activeCompanyId,
      title: form.title,
      department: form.department || undefined,
      employmentType: form.employmentType,
      workMode: form.workMode,
      location: form.location || undefined,
      salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
      salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
      currency: form.currency || "USD",
      description: form.description,
      responsibilities: form.responsibilities || undefined,
      requiredSkills: form.requiredSkills,
      preferredSkills: form.preferredSkills,
      experienceLevel: form.experienceLevel || undefined,
      education: form.education || undefined,
      vacancies: Number(form.vacancies) || 1,
      deadline: form.deadline || undefined,
      applyMode: form.applyMode,
      externalUrl: form.applyMode === "external" ? form.externalUrl : undefined,
    } }),
    onSuccess: () => { toast.success("Saved"); navigate({ to: "/employer/jobs" }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="font-display text-2xl font-bold">Edit job</h1>
      <JobForm value={form} onChange={setForm} onSubmit={() => m.mutate()} submitLabel="Save changes" isPending={m.isPending} />
    </div>
  );
}
