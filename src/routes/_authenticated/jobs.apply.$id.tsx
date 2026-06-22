import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Building2, MapPin, Loader2, Send, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getJob } from "@/lib/jobs.functions";
import { submitApplication } from "@/lib/employer/applications.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/jobs/apply/$id")({
  head: () => ({ meta: [{ title: "Apply — Career Boost" }] }),
  component: ApplyPage,
});

function ApplyPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const getJobFn = useServerFn(getJob);
  const submitFn = useServerFn(submitApplication);

  const [name, setName] = useState("");
  const [resume, setResume] = useState("");
  const [cover, setCover] = useState("");

  const jobQ = useQuery({
    queryKey: ["job-detail", `internal:${id}`],
    queryFn: () => getJobFn({ data: { slug: `internal:${id}` } }),
    staleTime: 60_000,
  });

  const applyM = useMutation({
    mutationFn: () =>
      submitFn({
        data: {
          jobId: id,
          resumeText: resume,
          coverLetter: cover || undefined,
          candidateName: name || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Application submitted! We've shared it with the recruiter.");
      navigate({ to: "/jobs/tracker" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to apply"),
  });

  if (jobQ.isLoading) {
    return <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (jobQ.isError || !jobQ.data) {
    return (
      <Card className="p-6">
        <div className="text-sm text-destructive">
          {jobQ.error instanceof Error ? jobQ.error.message : "Couldn't load this job."}
        </div>
        <Link to="/jobs" className="mt-3 inline-flex items-center gap-1 text-sm text-primary-glow hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to jobs
        </Link>
      </Card>
    );
  }

  const job = jobQ.data;
  if (job.applyMode === "external") {
    return (
      <Card className="p-6 space-y-3">
        <div className="text-sm">This role uses an external application link.</div>
        <Button variant="hero" asChild>
          <a href={job.url} target="_blank" rel="noopener noreferrer">Continue to apply</a>
        </Button>
      </Card>
    );
  }

  const canSubmit = resume.trim().length >= 50 && !applyM.isPending;

  return (
    <div className="space-y-5">
      <Link
        to="/jobs/detail/$"
        params={{ _splat: encodeURIComponent(job.slug) }}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to job
      </Link>

      <Card className="bg-card-gradient p-6">
        <Badge className="mb-2 bg-primary-glow/20 text-primary-glow hover:bg-primary-glow/30">Employer</Badge>
        <h1 className="font-display text-2xl font-bold md:text-3xl">{job.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {job.company && <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{job.company}</span>}
          {job.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>}
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div>
          <h2 className="font-display text-lg font-semibold">Submit your application</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Our AI will analyze your resume against this role and share an ATS score with the recruiter.
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="name">Full name <span className="text-muted-foreground">(optional)</span></Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="resume">Resume content <span className="text-destructive">*</span></Label>
          <Textarea
            id="resume"
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            placeholder="Paste your resume text here (skills, experience, education)…"
            className="min-h-[220px]"
          />
          <div className="text-xs text-muted-foreground">
            {resume.trim().length} chars · minimum 50
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="cover">Cover letter <span className="text-muted-foreground">(optional)</span></Label>
          <Textarea
            id="cover"
            value={cover}
            onChange={(e) => setCover(e.target.value)}
            placeholder="Why are you a great fit for this role?"
            className="min-h-[140px]"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button variant="hero" disabled={!canSubmit} onClick={() => applyM.mutate()}>
            {applyM.isPending ? (
              <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Submitting…</>
            ) : (
              <><Send className="mr-1.5 h-3.5 w-3.5" /> Submit application</>
            )}
          </Button>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> AI ATS score generated on submit
          </div>
        </div>
      </Card>
    </div>
  );
}
