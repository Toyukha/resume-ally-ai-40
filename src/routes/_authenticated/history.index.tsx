import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Trash2, Loader2, Plus, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listAnalyses, deleteAnalysis } from "@/lib/analyze.functions";
import { toast } from "sonner";


export const Route = createFileRoute("/_authenticated/history/")({
  head: () => ({ meta: [{ title: "History — Get That Job" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const listFn = useServerFn(listAnalyses);
  const deleteFn = useServerFn(deleteAnalysis);
  const qc = useQueryClient();

  const { data: analyses, isLoading } = useQuery({
    queryKey: ["analyses"],
    queryFn: () => listFn(),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["analyses"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  const hasContent = analyses && analyses.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold md:text-4xl">Your analyses</h1>
            <p className="mt-1 text-muted-foreground">All your past resume optimizations.</p>
          </div>
          <Button variant="hero" asChild>
            <Link to="/dashboard"><Plus className="mr-2 h-4 w-4" /> New analysis</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : !hasContent ? (
          <Card className="p-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 font-display text-lg font-semibold">No analyses yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Run your first analysis to see it here.</p>
            <Button className="mt-6" variant="hero" asChild>
              <Link to="/dashboard">Get started</Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {analyses!.map((a) => {

                  const tone = a.match_score >= 80 ? "text-success" : a.match_score >= 60 ? "text-gold" : "text-destructive";
                  return (
                    <Card key={a.id} className="group relative flex items-center justify-between gap-4 p-5 transition-shadow hover:shadow-md">
                      <Link
                        to="/history/$id"
                        params={{ id: a.id }}
                        className="min-w-0 flex-1 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`font-display text-2xl font-bold ${tone}`}>{a.match_score}</div>
                          <div className="min-w-0">
                            <div className="truncate font-medium">{a.resume_filename || "Untitled resume"}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(a.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{a.summary}</p>
                        <div className="mt-2 flex items-center text-xs font-medium text-primary">
                          View details <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </Link>
                      <Button
                        variant="ghost" size="icon"
                        onClick={(e) => { e.stopPropagation(); del.mutate(a.id); }}
                        disabled={del.isPending}
                        aria-label="Delete"
                        className="shrink-0"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </Card>
                  );
                })}
          </div>
        )}

      </main>
    </div>
  );
}
