import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { isSuperAdmin } from "@/lib/admin-access";

// Mirror src/routes/admin/route.tsx — but record every server-fn call so we can
// prove getPlatformStats is NEVER invoked unless the user is super_admin.
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...rest}>{children}</a>
  ),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { signOut: vi.fn().mockResolvedValue({}) } },
}));

import { AccessDenied } from "@/components/access-denied";

type Me = { isAdmin: boolean; roles: string[]; email: string | null };

function makeHarness(me: Me) {
  const getPlatformStatsSpy = vi.fn(async () => ({ totalUsers: 1 }));
  const getAdminMeSpy = vi.fn(async () => me);

  // Component that simulates AdminOverview — would fire getPlatformStats on mount.
  function AdminOverviewLike() {
    useQuery({ queryKey: ["admin-stats", me.roles.join(",")], queryFn: () => getPlatformStatsSpy() });
    return <div data-testid="admin-content">ADMIN OUTLET</div>;
  }

  // Mirror the route gate exactly: block render until fresh data, then check
  // isSuperAdmin before mounting children. This is what protects getPlatformStats.
  function AdminGate() {
    const { data, isLoading, isFetching } = useQuery({
      queryKey: ["admin-me", me.roles.join(",")],
      queryFn: () => getAdminMeSpy(),
      staleTime: 0,
      gcTime: 0,
    });
    if (isLoading || isFetching || !data) {
      return <div>Verifying admin access…</div>;
    }
    if (!isSuperAdmin(data.roles)) return <AccessDenied />;
    return <AdminOverviewLike />;
  }

  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const utils = render(
    <QueryClientProvider client={qc}>
      <AdminGate />
    </QueryClientProvider>,
  );
  return { ...utils, getPlatformStatsSpy, getAdminMeSpy };
}

describe("/admin never leaks getPlatformStats to non-super-admins", () => {
  it("super_admin: outlet mounts and getPlatformStats IS called", async () => {
    const h = makeHarness({ isAdmin: true, roles: ["super_admin"], email: "super@x.com" });
    expect(await screen.findByTestId("admin-content")).toBeInTheDocument();
    await waitFor(() => expect(h.getPlatformStatsSpy).toHaveBeenCalledTimes(1));
  });

  it("regular signed-in user (no roles): denied + getPlatformStats NEVER called", async () => {
    const h = makeHarness({ isAdmin: false, roles: [], email: "user@x.com" });
    expect(await screen.findByText(/Access Denied/i)).toBeInTheDocument();
    expect(h.getPlatformStatsSpy).not.toHaveBeenCalled();
  });

  it("admin (non-super) role: denied + getPlatformStats NEVER called", async () => {
    const h = makeHarness({ isAdmin: true, roles: ["admin"], email: "admin@x.com" });
    expect(await screen.findByText(/Access Denied/i)).toBeInTheDocument();
    expect(h.getPlatformStatsSpy).not.toHaveBeenCalled();
  });

  it("support_admin + analytics_admin combo: denied + getPlatformStats NEVER called", async () => {
    const h = makeHarness({
      isAdmin: true,
      roles: ["support_admin", "analytics_admin"],
      email: "support@x.com",
    });
    expect(await screen.findByText(/Access Denied/i)).toBeInTheDocument();
    expect(h.getPlatformStatsSpy).not.toHaveBeenCalled();
  });
});
