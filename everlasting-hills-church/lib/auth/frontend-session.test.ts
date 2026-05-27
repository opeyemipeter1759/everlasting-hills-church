import { describe, expect, it } from "vitest";
import {
  hasMinRole,
  normalizeRole,
  getRequiredRole,
  getLandingPage,
  type UserRole,
} from "./frontend-session";

/**
 * Pure-function tests for the role helpers.
 *
 * These functions are the spine of the dashboard's route protection and rendering
 * decisions. Bugs here let unauthorized users see/render protected views.
 */

describe("normalizeRole", () => {
  it.each([
    ["member", "MEMBER"],
    ["MEMBER", "MEMBER"],
    ["leader", "UNIT_LEAD"],
    ["unit head", "UNIT_LEAD"],
    ["unit_head", "UNIT_LEAD"],
    ["admin", "ADMIN"],
    ["pastor", "PASTOR"],
    ["superadmin", "SUPER_ADMIN"],
    ["super admin", "SUPER_ADMIN"],
    ["super_admin", "SUPER_ADMIN"],
    ["SUPER_ADMIN", "SUPER_ADMIN"],
    ["Pastor ", "PASTOR"], // trims
  ] as [string, UserRole][])("normalizes %s → %s", (input, expected) => {
    expect(normalizeRole(input)).toBe(expected);
  });

  it.each([null, undefined, "", "guest", "robot", "VISITOR"])(
    "returns null for invalid role %s",
    (input) => {
      expect(normalizeRole(input)).toBeNull();
    },
  );
});

describe("hasMinRole (hierarchy)", () => {
  it("MEMBER does NOT satisfy ADMIN", () => {
    expect(hasMinRole("MEMBER", "ADMIN")).toBe(false);
  });

  it("PASTOR satisfies ADMIN", () => {
    expect(hasMinRole("PASTOR", "ADMIN")).toBe(true);
  });

  it("SUPER_ADMIN satisfies every role", () => {
    expect(hasMinRole("SUPER_ADMIN", "MEMBER")).toBe(true);
    expect(hasMinRole("SUPER_ADMIN", "UNIT_LEAD")).toBe(true);
    expect(hasMinRole("SUPER_ADMIN", "ADMIN")).toBe(true);
    expect(hasMinRole("SUPER_ADMIN", "PASTOR")).toBe(true);
    expect(hasMinRole("SUPER_ADMIN", "SUPER_ADMIN")).toBe(true);
  });

  it("a role satisfies itself", () => {
    expect(hasMinRole("ADMIN", "ADMIN")).toBe(true);
  });

  it("normalizes lowercase input before checking", () => {
    expect(hasMinRole("pastor", "ADMIN")).toBe(true);
  });

  it("null/undefined/invalid never satisfies anything", () => {
    expect(hasMinRole(null, "MEMBER")).toBe(false);
    expect(hasMinRole(undefined, "MEMBER")).toBe(false);
    expect(hasMinRole("robot", "MEMBER")).toBe(false);
  });
});

describe("getRequiredRole (route → minimum-role map)", () => {
  it("audit-log requires SUPER_ADMIN", () => {
    expect(getRequiredRole("/dashboard/audit-log")).toBe("SUPER_ADMIN");
    expect(getRequiredRole("/dashboard/audit-log/123")).toBe("SUPER_ADMIN");
  });

  it("sermon CMS + alerts + reports + giving + subscribers require PASTOR", () => {
    expect(getRequiredRole("/dashboard/sermons")).toBe("PASTOR");
    expect(getRequiredRole("/dashboard/subscribers")).toBe("PASTOR");
    expect(getRequiredRole("/dashboard/alerts")).toBe("PASTOR");
    expect(getRequiredRole("/dashboard/reports")).toBe("PASTOR");
    expect(getRequiredRole("/dashboard/giving")).toBe("PASTOR");
    expect(getRequiredRole("/dashboard/analytics/engagement")).toBe("PASTOR");
    expect(getRequiredRole("/dashboard/analytics/giving")).toBe("PASTOR");
  });

  it("members + first-timers + services + analytics/{attendance,growth,first-timers} require ADMIN", () => {
    expect(getRequiredRole("/dashboard/members")).toBe("ADMIN");
    expect(getRequiredRole("/dashboard/first-timers")).toBe("ADMIN");
    expect(getRequiredRole("/dashboard/services")).toBe("ADMIN");
    expect(getRequiredRole("/dashboard/analytics/attendance")).toBe("ADMIN");
    expect(getRequiredRole("/dashboard/analytics/growth")).toBe("ADMIN");
  });

  it("units + analytics/departments require UNIT_LEAD", () => {
    expect(getRequiredRole("/dashboard/units")).toBe("UNIT_LEAD");
    expect(getRequiredRole("/dashboard/analytics/departments")).toBe("UNIT_LEAD");
  });

  it("plain dashboard + /me require MEMBER", () => {
    expect(getRequiredRole("/dashboard")).toBe("MEMBER");
    expect(getRequiredRole("/dashboard/profile")).toBe("MEMBER");
    expect(getRequiredRole("/me")).toBe("MEMBER");
    expect(getRequiredRole("/change-password")).toBe("MEMBER");
  });

  it("unknown paths return null (no protection)", () => {
    expect(getRequiredRole("/")).toBeNull();
    expect(getRequiredRole("/about")).toBeNull();
    expect(getRequiredRole("/sermons")).toBeNull(); // public sermon route
  });
});

describe("getLandingPage", () => {
  it("returns /dashboard for any normalized role", () => {
    expect(getLandingPage("MEMBER")).toBe("/dashboard");
    expect(getLandingPage("admin")).toBe("/dashboard");
  });

  it("returns /login for null/invalid role (unauthenticated)", () => {
    expect(getLandingPage(null)).toBe("/login");
    expect(getLandingPage(undefined)).toBe("/login");
    expect(getLandingPage("robot")).toBe("/login");
  });
});
