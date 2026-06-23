import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin-layout";
import { AccessDenied } from "@/components/access-denied";
import { isSuperAdmin } from "@/lib/admin-access";
import { getAdminBootstrap } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    if (location.pathname === "/admin/login") return;
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/admin/login" });
  },
  component: AdminRoute,
});

function AdminRoute() {
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  if (path === "/admin/login") return <Outlet />;

  const fn = useServerFn(getAdminBootstrap);
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin-bootstrap"],
    queryFn: () => fn(),
    staleTime: 30_000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
    refetchOnWindowFocus: false,
  });

  if (isLoading || isFetching || !data) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Verifying admin access…
      </div>
    );
  }

  if (!isSuperAdmin(data.me.roles)) return <AccessDenied />;

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
