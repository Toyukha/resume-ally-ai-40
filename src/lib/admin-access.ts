// Pure access-control helpers shared by server functions and the admin route guard.
// Kept dependency-free so it can be unit tested without booting the server.

export const ADMIN_ROLES = ["super_admin", "admin", "support_admin", "analytics_admin"] as const;
export type AppRole = (typeof ADMIN_ROLES)[number];

export function isSuperAdmin(roles: readonly string[] | null | undefined): boolean {
  return Array.isArray(roles) && roles.includes("super_admin");
}

export function assertSuperAdmin(roles: readonly string[] | null | undefined): void {
  if (!isSuperAdmin(roles)) throw new Error("Forbidden: super_admin required");
}
