import { Link } from "@tanstack/react-router";
import { Briefcase, Bookmark, Kanban, Sparkles } from "lucide-react";

type Tab = { to: "/jobs" | "/jobs/saved" | "/jobs/tracker" | "/jobs/recommendations"; label: string; icon: typeof Briefcase; exact?: boolean };
const TABS: Tab[] = [
  { to: "/jobs", label: "Browse", icon: Briefcase, exact: true },
  { to: "/jobs/saved", label: "Saved", icon: Bookmark },
  { to: "/jobs/tracker", label: "Tracker", icon: Kanban },
  { to: "/jobs/recommendations", label: "For You", icon: Sparkles },
];

export function JobsTabs() {
  return (
    <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-border bg-card/40 p-1">
      {TABS.map((t) => (
        <Link
          key={t.to}
          to={t.to}
          activeOptions={{ exact: t.exact ?? false }}
          activeProps={{ className: "bg-primary text-primary-foreground shadow-glow" }}
          inactiveProps={{ className: "text-muted-foreground hover:bg-accent hover:text-foreground" }}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
        >
          <t.icon className="h-3.5 w-3.5" />
          {t.label}
        </Link>
      ))}
    </div>
  );
}
