import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DndContext, type DragEndEvent, PointerSensor, useDroppable, useDraggable, useSensor, useSensors } from "@dnd-kit/core";
import { ExternalLink, Loader2, Trash2, Kanban } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  listApplications,
  updateApplicationStatus,
  deleteApplication,
  APP_STATUSES,
} from "@/lib/jobs.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/jobs/tracker")({
  component: Tracker,
});

type Status = (typeof APP_STATUSES)[number];

const COLUMN_META: Record<Status, { label: string; tint: string }> = {
  saved: { label: "Saved", tint: "border-muted" },
  applied: { label: "Applied", tint: "border-primary-glow/40" },
  interview: { label: "Interview", tint: "border-gold/40" },
  assessment: { label: "Assessment", tint: "border-gold/40" },
  offer: { label: "Offer", tint: "border-success/40" },
  rejected: { label: "Rejected", tint: "border-destructive/40" },
};

type AppRow = Awaited<ReturnType<typeof listApplications>>[number];

function Tracker() {
  const listFn = useServerFn(listApplications);
  const updateFn = useServerFn(updateApplicationStatus);
  const deleteFn = useServerFn(deleteApplication);
  const qc = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [localRows, setLocalRows] = useState<AppRow[] | null>(null);

  const q = useQuery({ queryKey: ["applications"], queryFn: () => listFn() });

  const updateM = useMutation({
    mutationFn: (vars: { id: string; status: Status }) => updateFn({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["applications"] }),
    onError: (e) => {
      setLocalRows(null);
      toast.error(e instanceof Error ? e.message : "Update failed");
    },
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      qc.invalidateQueries({ queryKey: ["jobs-dashboard"] });
      toast.success("Removed");
    },
  });

  if (q.isLoading) return <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  const rows = localRows ?? q.data ?? [];

  if (rows.length === 0) {
    return (
      <Card className="grid place-items-center gap-2 p-12 text-center">
        <Kanban className="h-8 w-8 text-muted-foreground" />
        <div className="font-semibold">No applications tracked yet</div>
        <p className="text-sm text-muted-foreground">Use "Track as Applied" from any job to start tracking.</p>
      </Card>
    );
  }

  const handleDragEnd = (e: DragEndEvent) => {
    const id = String(e.active.id);
    const next = e.over?.id as Status | undefined;
    if (!next || !APP_STATUSES.includes(next)) return;
    const row = rows.find((r) => r.id === id);
    if (!row || row.status === next) return;
    setLocalRows(rows.map((r) => (r.id === id ? { ...r, status: next } : r)));
    updateM.mutate({ id, status: next });
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-flow-col auto-cols-[minmax(260px,1fr)] gap-3 overflow-x-auto pb-4">
        {APP_STATUSES.map((s) => (
          <Column key={s} status={s} apps={rows.filter((r) => r.status === s)} onDelete={(id) => deleteM.mutate(id)} />
        ))}
      </div>
    </DndContext>
  );
}

function Column({ status, apps, onDelete }: { status: Status; apps: AppRow[]; onDelete: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = COLUMN_META[status];
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[400px] flex-col rounded-xl border bg-card/30 p-3 transition-colors ${meta.tint} ${isOver ? "bg-accent/40" : ""}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="font-display text-sm font-semibold">{meta.label}</div>
        <Badge variant="outline">{apps.length}</Badge>
      </div>
      <div className="space-y-2">
        {apps.map((a) => <AppCard key={a.id} app={a} onDelete={onDelete} />)}
      </div>
    </div>
  );
}

function AppCard({ app, onDelete }: { app: AppRow; onDelete: (id: string) => void }) {
  const { setNodeRef, listeners, attributes, transform, isDragging } = useDraggable({ id: app.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-lg border border-border bg-card-gradient p-3 ${isDragging ? "opacity-50" : ""}`}
    >
      <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
        <div className="line-clamp-2 text-sm font-semibold">{app.title}</div>
        {app.company && <div className="mt-0.5 text-xs text-muted-foreground">{app.company}</div>}
      </div>
      <div className="mt-2 flex items-center gap-1">
        {app.url && (
          <Button size="sm" variant="ghost" asChild className="h-7 px-2 text-xs">
            <a href={app.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(app.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
