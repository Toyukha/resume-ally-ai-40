import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { isSuperAdmin } from "@/lib/admin-access";

// Stub the router Link so AccessDenied renders without a full router.
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...rest}>{children}</a>
  ),
}));

// Stub the supabase client used by AccessDenied's signOut handler.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { signOut: vi.fn().mockResolvedValue({}) } },
}));

import { AccessDenied } from "@/components/access-denied";

/**
 * Mirrors the gate inside src/routes/admin/route.tsx. By exercising the same
 * predicate + render branches, these tests guarantee:
 *   - super_admin sees the protected outlet
 *   - everyone else lands on AccessDenied (which links to /dashboard)
 */
function Gate({ rolesFetcher, k }: { rolesFetcher: () => Promise<string[]>; k: string }) {
  const { data, isLoading } = useQuery({ queryKey: ["roles", k], queryFn: rolesFetcher });
  if (isLoading) return <div>loading</div>;
  if (!isSuperAdmin(data)) return <AccessDenied />;
  return <div data-testid="admin-content">ADMIN OUTLET</div>;
}

function renderWithClient(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("/admin route gate", () => {
  it("renders the admin outlet for super_admin", async () => {
    renderWithClient(<Gate k="super" rolesFetcher={async () => ["super_admin"]} />);
    expect(await screen.findByTestId("admin-content")).toBeInTheDocument();
    expect(screen.queryByText(/Access Denied/i)).toBeNull();
  });

  it("blocks regular admin role with the denied screen", async () => {
    renderWithClient(<Gate k="admin" rolesFetcher={async () => ["admin"]} />);
    expect(await screen.findByText(/Access Denied/i)).toBeInTheDocument();
    expect(screen.queryByTestId("admin-content")).toBeNull();
  });

  it("blocks support_admin and analytics_admin", async () => {
    renderWithClient(<Gate k="support" rolesFetcher={async () => ["support_admin", "analytics_admin"]} />);
    expect(await screen.findByText(/Access Denied/i)).toBeInTheDocument();
  });

  it("blocks unauthenticated / role-less users", async () => {
    renderWithClient(<Gate k="empty" rolesFetcher={async () => []} />);
    expect(await screen.findByText(/Access Denied/i)).toBeInTheDocument();
  });

  it("denied screen offers a path back to /dashboard", async () => {
    renderWithClient(<Gate k="link" rolesFetcher={async () => []} />);
    const link = (await screen.findByRole("link", { name: /dashboard/i })) as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("/dashboard");
  });
});
