import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Briefcase, Globe2 } from "lucide-react";
import { getJobStats } from "@/lib/jobs.functions";

function fmt(n: number): string {
  if (!n) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return n.toLocaleString();
}

export function JobStatsStrip() {
  const fn = useServerFn(getJobStats);
  const { data } = useQuery({
    queryKey: ["job-stats"],
    queryFn: () => fn(),
    staleTime: 60 * 60_000,
  });

  const stats = [
    { label: "Remote",           emoji: "🌍", n: data?.remote },
    { label: "UK",               emoji: "🇬🇧", n: data?.uk },
    { label: "US",               emoji: "🇺🇸", n: data?.us },
    { label: "Canada",           emoji: "🇨🇦", n: data?.canada },
    { label: "Germany",          emoji: "🇩🇪", n: data?.germany },
    { label: "Customer Success", emoji: "💼", n: data?.customerSuccess },
  ];

  return (
    <div className="-mx-1 flex items-center gap-2 overflow-x-auto rounded-2xl border border-border bg-gradient-to-r from-card/60 to-card/30 p-3 text-xs">
      <div className="flex shrink-0 items-center gap-1 pr-2 text-muted-foreground">
        <Globe2 className="h-3.5 w-3.5" /> Live counts:
      </div>
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border/60 bg-background/60 px-2.5 py-1"
        >
          <span>{s.emoji}</span>
          <span className="font-semibold tabular-nums">{fmt(s.n ?? 0)}</span>
          <span className="text-muted-foreground">{s.label}</span>
        </div>
      ))}
      <div className="ml-auto hidden shrink-0 items-center gap-1 text-muted-foreground md:flex">
        <Briefcase className="h-3.5 w-3.5" />
        updated hourly
      </div>
    </div>
  );
}
