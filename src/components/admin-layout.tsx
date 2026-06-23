import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard, Users, FileBarChart2, CreditCard, Activity,
  ShieldCheck, BellRing, LogOut, Sparkles, Menu, X, AlertTriangle, HeartPulse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminBootstrap } from "@/lib/admin.functions";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/health", label: "Health", icon: HeartPulse },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { to: "/admin/analyses", label: "Analyses", icon: FileBarChart2 },
  { to: "/admin/revenue", label: "Revenue", icon: Activity },
  { to: "/admin/activations", label: "Activations", icon: AlertTriangle },
  { to: "/admin/admins", label: "Admins", icon: ShieldCheck },
  { to: "/admin/logs", label: "Activity Logs", icon: BellRing },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const fn = useServerFn(getAdminBootstrap);
  const meQuery = useQuery({
    queryKey: ["admin-bootstrap"],
    queryFn: () => fn(),
    staleTime: 30_000,
  });
  const me = meQuery.data?.me;

  useEffect(() => {
    if (meQuery.isSuccess && !me?.isAdmin) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [meQuery.isSuccess, me?.isAdmin, navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
  };

  if (meQuery.isLoading || !me) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading admin…</div>;
  }
  if (!me.isAdmin) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Redirecting…</div>;
  }

  const roles = me.roles;

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-background transition-transform md:relative md:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
      )}>
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link to="/admin" className="flex items-center gap-2 font-display text-base font-bold">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-hero shadow-glow">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span>Admin</span>
          </Link>
          <button className="md:hidden" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <nav className="space-y-1 p-3">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute inset-x-0 bottom-0 border-t p-3">
          <div className="mb-2 truncate text-xs text-muted-foreground">
            {meQuery.data.email}
            <div className="mt-0.5 flex flex-wrap gap-1">
              {roles.map((r) => (
                <span key={r} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{r}</span>
              ))}
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur md:px-6">
          <button className="md:hidden" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <div className="text-sm font-medium text-muted-foreground">Career Boost — Admin Portal</div>
          <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground">User app →</Link>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

export function isSuperAdmin(roles: string[] | undefined) {
  return !!roles?.includes("super_admin");
}
