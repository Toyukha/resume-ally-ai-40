import { describe, it, expect } from "vitest";
import { isSuperAdmin, assertSuperAdmin } from "@/lib/admin-access";

describe("admin access control", () => {
  describe("isSuperAdmin", () => {
    it("returns true when super_admin is present", () => {
      expect(isSuperAdmin(["super_admin"])).toBe(true);
      expect(isSuperAdmin(["admin", "super_admin"])).toBe(true);
    });

    it("returns false for non-super roles", () => {
      expect(isSuperAdmin(["admin"])).toBe(false);
      expect(isSuperAdmin(["support_admin", "analytics_admin"])).toBe(false);
      expect(isSuperAdmin([])).toBe(false);
    });

    it("returns false for nullish input", () => {
      expect(isSuperAdmin(null)).toBe(false);
      expect(isSuperAdmin(undefined)).toBe(false);
    });
  });

  describe("assertSuperAdmin", () => {
    it("passes for super_admin", () => {
      expect(() => assertSuperAdmin(["super_admin"])).not.toThrow();
    });

    it("throws Forbidden for everyone else", () => {
      expect(() => assertSuperAdmin([])).toThrow(/super_admin required/);
      expect(() => assertSuperAdmin(["admin"])).toThrow(/super_admin required/);
      expect(() => assertSuperAdmin(null)).toThrow(/super_admin required/);
    });
  });
});
