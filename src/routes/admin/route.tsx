import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin-layout";
import { AccessDenied } from "@/components/access-denied";
import { isSuperAdmin } from "@/lib/admin-access";
import { getAdminMe } from "@/lib/admin.functions";

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

  const fn = useServerFn(getAdminMe);
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin-me"],
    queryFn: () => fn(),
    staleTime: 0,
    gcTime: 0,
  });

  // Block children until we have a FRESH role check — never serve stale super-admin
  // data from a previous user's session.
  if (isLoading || isFetching || !data) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Verifying admin access…
      </div>
    );
  }

  if (!isSuperAdmin(data?.roles)) return <AccessDenied />;

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
