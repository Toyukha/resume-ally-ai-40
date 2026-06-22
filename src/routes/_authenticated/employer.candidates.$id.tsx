import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, RefreshCw, Calendar as CalendarIcon, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MatchScoreRing } from "@/components/jobs/match-score-ring";
import { getApplication, rescoreApplication, updateApplicationStage } from "@/lib/employer/applications.functions";
import { listApplicationInterviews, scheduleInterview, addInterviewNote, setInterviewStatus } from "@/lib/employer/interviews.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/employer/candidates/$id")({
  head: () => ({ meta: [{ title: "Candidate — Employer" }] }),
  component: CandidatePage,
});

const STAGES = ["applied","under_review","shortlisted","interview_scheduled","assessment","final_review","offer_sent","hired","rejected"] as const;

function CandidatePage() {
  const { id } = useParams({ from: "/_authenticated/employer/candidates/$id" });
  const qc = useQueryClient();
  const getFn = useServerFn(getApplication);
  const rescoreFn = useServerFn(rescoreApplication);
  const stageFn = useServerFn(updateApplicationStage);
  const intsFn = useServerFn(listApplicationInterviews);
  const scheduleFn = useServerFn(scheduleInterview);
  const noteFn = useServerFn(addInterviewNote);
  const intStatusFn = useServerFn(setInterviewStatus);

  const { data: app, isLoading } = useQuery({ queryKey: ["application", id], queryFn: () => getFn({ data: { id } }) });
  const { data: interviews = [] } = useQuery({ queryKey: ["application-interviews", id], queryFn: () => intsFn({ data: { applicationId: id } }) });

  const reload = () => {
    qc.invalidateQueries({ queryKey: ["application", id] });
    qc.invalidateQueries({ queryKey: ["application-interviews", id] });
  };

  const rescoreM = useMutation({
    mutationFn: () => rescoreFn({ data: { id } }),
    onSuccess: () => { toast.success("Rescored"); reload(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const stageM = useMutation({
    mutationFn: (stage: typeof STAGES[number]) => stageFn({ data: { id, stage } }),
    onSuccess: () => { toast.success("Stage updated"); reload(); },
  });

  const [interviewOpen, setInterviewOpen] = useState(false);
  const [iv, setIv] = useState({ date: "", time: "", duration: 30, mode: "video" as const, link: "" });
  const scheduleM = useMutation({
    mutationFn: () => scheduleFn({ data: {
      applicationId: id,
      scheduledFor: new Date(`${iv.date}T${iv.time}`).toISOString(),
      durationMinutes: iv.duration,
      mode: iv.mode,
      locationOrLink: iv.link || undefined,
    } }),
    onSuccess: () => { toast.success("Interview scheduled"); setInterviewOpen(false); reload(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (isLoading || !app) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const score: any = Array.isArray(app.score) ? app.score[0] : app.score;
  const job: any = app.job;

  return (
    <div className="space-y-5">
      <Link to="/employer/pipeline/$jobId" params={{ jobId: job?.id ?? "" }} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Back to pipeline
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <MatchScoreRing score={score?.ats_score ?? 0} size={88} />
          <div>
            <h1 className="font-display text-2xl font-bold">{app.candidate_name ?? app.candidate_email ?? "Candidate"}</h1>
            <p className="text-sm text-muted-foreground">Applied to {job?.title} · {new Date(app.applied_at).toLocaleDateString()}</p>
            <Badge variant="outline" className="mt-1 capitalize">{app.stage.replace(/_/g, " ")}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => rescoreM.mutate()} disabled={rescoreM.isPending}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${rescoreM.isPending ? "animate-spin" : ""}`} /> Re-score
          </Button>
          <Button variant="hero" onClick={() => setInterviewOpen(true)}>
            <CalendarIcon className="mr-1.5 h-3.5 w-3.5" /> Schedule interview
          </Button>
          <select
            value={app.stage}
            onChange={(e) => stageM.mutate(e.target.value as any)}
            className="h-9 rounded-md border border-border bg-background px-2 text-sm"
          >
            {STAGES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="bg-card-gradient p-5 lg:col-span-2">
          <h2 className="mb-3 font-display font-semibold">ATS Analysis</h2>
          {score ? (
            <>
              <p className="text-sm text-muted-foreground">{score.summary}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Bar label="Skills" value={score.skills_match_pct} />
                <Bar label="Experience" value={score.experience_match_pct} />
                <Bar label="Education" value={score.education_match_pct} />
                <Bar label="Keywords" value={score.keyword_match_pct} />
              </div>
              {score.strengths?.length > 0 && (
                <div className="mt-4">
                  <h3 className="mb-1 text-sm font-semibold">Strengths</h3>
                  <ul className="space-y-1 text-sm">
                    {(score.strengths as string[]).map((s, i) => <li key={i} className="flex gap-2"><span className="text-success">✓</span>{s}</li>)}
                  </ul>
                </div>
              )}
              {score.gaps?.length > 0 && (
                <div className="mt-4">
                  <h3 className="mb-1 text-sm font-semibold">Gaps</h3>
                  <ul className="space-y-1 text-sm">
                    {(score.gaps as string[]).map((s, i) => <li key={i} className="flex gap-2"><span className="text-gold">!</span>{s}</li>)}
                  </ul>
                </div>
              )}
              {score.missing_keywords?.length > 0 && (
                <div className="mt-4">
                  <h3 className="mb-1 text-sm font-semibold">Missing Keywords</h3>
                  <div className="flex flex-wrap gap-1">{score.missing_keywords.map((k: string) => <Badge key={k} variant="outline">{k}</Badge>)}</div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">AI screening is running… try re-scoring.</p>
          )}

          {app.cover_letter && (
            <div className="mt-5 border-t border-border pt-4">
              <h3 className="mb-1 text-sm font-semibold">Cover letter</h3>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{app.cover_letter}</p>
            </div>
          )}

          {app.resume_text && (
            <div className="mt-5 border-t border-border pt-4">
              <h3 className="mb-1 text-sm font-semibold">Resume</h3>
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-background/40 p-3 font-mono text-[11px] text-muted-foreground">{app.resume_text}</pre>
            </div>
          )}
        </Card>

        <Card className="bg-card-gradient p-5">
          <h2 className="mb-3 font-display font-semibold">Interviews</h2>
          {interviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No interviews scheduled.</p>
          ) : (
            <ul className="space-y-3">
              {interviews.map((iv: any) => (
                <li key={iv.id} className="rounded-lg border border-border/60 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{new Date(iv.scheduled_for).toLocaleString()}</div>
                      <div className="text-[11px] uppercase text-muted-foreground">{iv.mode} · {iv.duration_minutes} min · {iv.status}</div>
                    </div>
                    <select value={iv.status} onChange={(e) => intStatusFn({ data: { id: iv.id, status: e.target.value as any } }).then(reload)} className="h-7 rounded border border-border bg-background px-1 text-xs">
                      {["scheduled","completed","passed","failed","cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  {iv.location_or_link && <a href={iv.location_or_link} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate text-xs text-primary-glow">{iv.location_or_link}</a>}
                  <NoteBox interviewId={iv.id} onAdded={reload} addNote={async (d) => { await noteFn({ data: d }); }} notes={iv.interview_notes ?? []} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {interviewOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <Card className="w-full max-w-md bg-card-gradient p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display font-semibold">Schedule interview</h3>
              <button onClick={() => setInterviewOpen(false)}><X className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Date</Label><Input type="date" value={iv.date} onChange={(e) => setIv({ ...iv, date: e.target.value })} /></div>
                <div><Label className="text-xs">Time</Label><Input type="time" value={iv.time} onChange={(e) => setIv({ ...iv, time: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Duration (min)</Label><Input type="number" value={iv.duration} onChange={(e) => setIv({ ...iv, duration: Number(e.target.value) })} /></div>
                <div>
                  <Label className="text-xs">Mode</Label>
                  <select value={iv.mode} onChange={(e) => setIv({ ...iv, mode: e.target.value as any })} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
                    <option value="video">Video</option><option value="phone">Phone</option><option value="onsite">Onsite</option>
                  </select>
                </div>
              </div>
              <div><Label className="text-xs">Link or address</Label><Input value={iv.link} onChange={(e) => setIv({ ...iv, link: e.target.value })} placeholder="https://meet.example.com/…" /></div>
              <Button variant="hero" disabled={!iv.date || !iv.time || scheduleM.isPending} onClick={() => scheduleM.mutate()}>
                {scheduleM.isPending ? "Scheduling…" : "Schedule"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{value}%</span></div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted/40">
        <div className="h-full bg-gradient-to-r from-primary to-primary-glow" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function NoteBox({ interviewId, notes, addNote, onAdded }: { interviewId: string; notes: any[]; addNote: (d: { interviewId: string; body: string; rating?: number }) => Promise<void>; onAdded: () => void }) {
  const [body, setBody] = useState("");
  const [rating, setRating] = useState(0);
  return (
    <div className="mt-2 space-y-2">
      {notes.map((n) => (
        <div key={n.id} className="rounded bg-background/40 p-2 text-xs">
          {n.rating && <div className="text-gold">{"★".repeat(n.rating)}</div>}
          <p className="whitespace-pre-wrap">{n.body}</p>
        </div>
      ))}
      <div className="flex flex-col gap-1">
        <Textarea rows={2} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Add a note…" className="text-xs" />
        <div className="flex items-center gap-1">
          {[1,2,3,4,5].map((n) => (
            <button key={n} onClick={() => setRating(n === rating ? 0 : n)} className={`text-sm ${rating >= n ? "text-gold" : "text-muted-foreground"}`}>★</button>
          ))}
          <Button size="sm" variant="ghost" className="ml-auto h-7" disabled={!body.trim()} onClick={async () => { await addNote({ interviewId, body, rating: rating || undefined }); setBody(""); setRating(0); onAdded(); }}>Add</Button>
        </div>
      </div>
    </div>
  );
}
