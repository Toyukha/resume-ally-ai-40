import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Search, RefreshCw, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { listActivationEvents, reconcileStuckActivations } from "@/lib/admin.functions";
import { Wrench } from "lucide-react";

export const Route = createFileRoute("/admin/activations")({
  head: () => ({ meta: [{ title: "Activation Diagnostics — Admin" }] }),
  component: ActivationsPage,
});

const EVENT_OPTIONS = [
  { value: "all", label: "All events" },
  { value: "activation_complete", label: "activation_complete" },
  { value: "already_verified", label: "already_verified" },
  { value: "activation_timeout", label: "activation_timeout" },
  { value: "activate_pro_plan_failed", label: "activate_pro_plan_failed" },
  { value: "flw_verify_failed", label: "flw_verify_failed" },
  { value: "payment_not_found", label: "payment_not_found" },
  { value: "payment_lookup_error", label: "payment_lookup_error" },
  { value: "payment_mark_successful_failed", label: "payment_mark_successful_failed" },
  { value: "config_missing", label: "config_missing" },
];

const HOURS_OPTIONS = [
  { value: 24, label: "Last 24 hours" },
  { value: 72, label: "Last 3 days" },
  { value: 168, label: "Last 7 days" },
  { value: 720, label: "Last 30 days" },
];

function ActivationsPage() {
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<"all" | "failure" | "success">("failure");
  const [event, setEvent] = useState<string>("all");
  const [hours, setHours] = useState<number>(168);

  const fn = useServerFn(listActivationEvents);
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["admin-activations", search, status, event, hours],
    queryFn: () =>
      fn({
        data: {
          search: search || undefined,
          status,
          event: event === "all" ? undefined : event,
          hours,
        },
      }),
  });

  const rows = data ?? [];

  const stats = useMemo(() => {
    const total = rows.length;
    const failures = rows.filter((r) => !r.success).length;
    const successes = total - failures;
    return { total, failures, successes };
  }, [rows]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Activation Diagnostics</h1>
          <p className="text-sm text-muted-foreground">
            Flutterwave payment activation events — surface failures, timeouts, and slow upgrades.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={async () => {
              setReconciling(true);
              setReconcileResult(null);
              try {
                const r = await reconcileFn({});
                setReconcileResult(r);
                await refetch();
              } catch (e) {
                setReconcileResult({ error: e instanceof Error ? e.message : "Reconcile failed" });
              } finally {
                setReconciling(false);
              }
            }}
            disabled={reconciling}
          >
            <Wrench className={`mr-2 h-4 w-4 ${reconciling ? "animate-pulse" : ""}`} />
            {reconciling ? "Reconciling…" : "Reconcile stuck activations"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-muted"><Clock className="h-4 w-4" /></div>
            <div>
              <div className="text-xs text-muted-foreground">Events in window</div>
              <div className="font-display text-xl font-semibold">{stats.total}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-destructive/10 text-destructive"><XCircle className="h-4 w-4" /></div>
            <div>
              <div className="text-xs text-muted-foreground">Failures</div>
              <div className="font-display text-xl font-semibold">{stats.failures}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-emerald-500/10 text-emerald-600"><CheckCircle2 className="h-4 w-4" /></div>
            <div>
              <div className="text-xs text-muted-foreground">Successes</div>
              <div className="font-display text-xl font-semibold">{stats.successes}</div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <form onSubmit={onSearch} className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[260px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search tx_ref, user id, email, plan tier, or error…"
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All outcomes</SelectItem>
              <SelectItem value="failure">Failures only</SelectItem>
              <SelectItem value="success">Successes only</SelectItem>
            </SelectContent>
          </Select>
          <Select value={event} onValueChange={setEvent}>
            <SelectTrigger className="w-[230px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {EVENT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(hours)} onValueChange={(v) => setHours(Number(v))}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {HOURS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" variant="default">Search</Button>
          {(search || event !== "all" || status !== "failure" || hours !== 168) && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSearch(""); setSearchInput(""); setStatus("failure"); setEvent("all"); setHours(168);
              }}
            >
              Clear
            </Button>
          )}
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">When</th>
                <th className="p-3">Event</th>
                <th className="p-3">User</th>
                <th className="p-3">tx_ref</th>
                <th className="p-3">Plan</th>
                <th className="p-3">Last known</th>
                <th className="p-3">Elapsed</th>
                <th className="p-3">Error</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b align-top last:border-0">
                  <td className="p-3 whitespace-nowrap text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <Badge variant={r.success ? "secondary" : "destructive"} className="font-mono text-[11px]">
                      {r.event}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="text-xs">{r.user_email ?? "—"}</div>
                    <code className="text-[10px] text-muted-foreground">{r.user_id?.slice(0, 8) ?? "—"}</code>
                  </td>
                  <td className="p-3 font-mono text-xs break-all">{r.tx_ref ?? "—"}</td>
                  <td className="p-3 text-xs">{r.plan_tier ?? "—"}</td>
                  <td className="p-3 text-xs">
                    {r.last_known_plan ?? "—"}
                    {r.last_known_plan_tier ? <span className="text-muted-foreground"> / {r.last_known_plan_tier}</span> : null}
                  </td>
                  <td className="p-3 text-xs tabular-nums">
                    {typeof r.elapsed_ms === "number" ? `${(r.elapsed_ms / 1000).toFixed(2)}s` : "—"}
                  </td>
                  <td className="p-3 text-xs text-destructive max-w-[280px]">
                    <div className="break-words">{r.error_message ?? "—"}</div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-muted-foreground">
                    {isFetching ? "Loading…" : "No activation events match these filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
