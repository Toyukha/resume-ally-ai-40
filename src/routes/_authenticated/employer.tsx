import { createFileRoute, Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Briefcase, LayoutDashboard, Users, Calendar, BarChart3, Settings, Building2, Kanban, Sparkles, LogOut } from "lucide-react";
import { listMyCompanies } from "@/lib/employer/companies.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/employer")({
  head: () => ({ meta: [{ title: "Employer Portal — Career Boost" }] }),
  component: EmployerLayout,
});

function EmployerLayout() {
  const listFn = useServerFn(listMyCompanies);
  const { data: companies, isLoading, error } = useQuery({
    queryKey: ["my-companies"],
    queryFn: () => listFn(),
    retry: false,
  });

  useEffect(() => {
    if (!error) return;
    const msg = (error as Error).message?.toLowerCase() ?? "";
    if (msg.includes("unauthorized") || msg.includes("auth") || msg.includes("jwt")) {
      window.location.href = "/employer/login";
    }
  }, [error]);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);

  useEffect(() => {
    if (!companies?.length) return;
    const stored = typeof window !== "undefined" ? localStorage.getItem("activeCompanyId") : null;
    const found = companies.find((c) => c.company.id === stored);
    setActiveCompanyId(found ? found.company.id : companies[0].company.id);
  }, [companies]);

  useEffect(() => {
    if (activeCompanyId) localStorage.setItem("activeCompanyId", activeCompanyId);
  }, [activeCompanyId]);

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">Loading employer portal…</div>;
  }

  if (!companies || companies.length === 0) {
    if (!pathname.startsWith("/employer/onboarding") && !pathname.startsWith("/employer/invite")) {
      throw redirect({ to: "/employer/onboarding" });
    }
    return (
      <div className="min-h-screen bg-background">
        <SimpleHeader />
        <main className="container mx-auto max-w-3xl px-4 py-10"><Outlet /></main>
      </div>
    );
  }

  const active = companies.find((c) => c.company.id === activeCompanyId) ?? companies[0];
  const ctx = { activeCompanyId: active.company.id, activeCompanyName: active.company.name, role: active.role };

  const nav = [
    { to: "/employer/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/employer/jobs", label: "Jobs", icon: Briefcase },
    { to: "/employer/pipeline", label: "Pipeline", icon: Kanban },
    { to: "/employer/interviews", label: "Interviews", icon: Calendar },
    { to: "/employer/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/employer/team", label: "Team", icon: Users },
    { to: "/employer/settings/company", label: "Settings", icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <SimpleHeader />
      <div className="flex">
        <aside className="hidden w-60 shrink-0 border-r border-border/60 bg-card/30 px-3 py-6 md:block">
          <div className="mb-5 px-2">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Workspace</div>
            {companies.length > 1 ? (
              <select
                value={active.company.id}
                onChange={(e) => setActiveCompanyId(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              >
                {companies.map((c) => (
                  <option key={c.company.id} value={c.company.id}>{c.company.name}</option>
                ))}
              </select>
            ) : (
              <div className="mt-1 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary-glow" />
                <span className="truncate font-display text-sm font-semibold">{active.company.name}</span>
              </div>
            )}
            <div className="mt-1 text-[10px] uppercase text-muted-foreground">{active.role.replace("_", " ")}</div>
          </div>
          <nav className="space-y-0.5">
            {nav.map((n) => {
              const isActive = pathname === n.to || pathname.startsWith(n.to + "/");
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 px-4 py-6 md:px-8">
          <EmployerContext.Provider value={ctx}>
            <Outlet />
          </EmployerContext.Provider>
        </main>
      </div>
    </div>
  );
}

function SimpleHeader() {
  const navigate = (path: string) => { window.location.href = path; };
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-base font-bold">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-hero shadow-glow">
            <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          Career Boost <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-glow">Employer</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/jobs">Job Seeker View</Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={async () => { await supabase.auth.signOut(); navigate("/"); }}>
            <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}

import { createContext, useContext } from "react";
type Ctx = { activeCompanyId: string; activeCompanyName: string; role: string };
const EmployerContext = createContext<Ctx | null>(null);
export function useEmployerCtx(): Ctx {
  const v = useContext(EmployerContext);
  if (!v) throw new Error("useEmployerCtx must be used inside the employer layout");
  return v;
}
