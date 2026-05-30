import { describe, expect, it } from "vitest";
import { getMemberDisplayId, normalizeRole } from "./shared";

/**
 * Pure-function tests for the dashboard's role-routing helpers.
 *
 * `normalizeRole` here is local to the dashboard module; the broader `frontend-session`
 * normalizer covers role-hint cookie strings. Keep both in sync.
 */

describe("getMemberDisplayId", () => {
  it('returns "EHC-NEW" for null/undefined id', () => {
    expect(getMemberDisplayId(null)).toBe("EHC-NEW");
    expect(getMemberDisplayId(undefined)).toBe("EHC-NEW");
  });

  it("uses last 4 hex chars of a uuid, uppercased, with EHC- prefix", () => {
    expect(getMemberDisplayId("8a5b3f2e-1234-5678-9abc-def012345abc")).toBe("EHC-5ABC");
    expect(getMemberDisplayId("d290f1ee-6c54-4b01-90e6-d701748f0851")).toMatch(/^EHC-[0-9A-F]{4}$/);
  });

  it("handles non-UUID ids (no hyphens) safely", () => {
    expect(getMemberDisplayId("abcdef")).toBe("EHC-CDEF");
  });

  it("uppercases hex letters", () => {
    expect(getMemberDisplayId("abcd")).toBe("EHC-ABCD");
  });

  it("works for ids shorter than 4 chars (still produces a valid display id)", () => {
    expect(getMemberDisplayId("xy")).toBe("EHC-XY");
  });
});

describe("normalizeRole (dashboard variant)", () => {
  it.each(["MEMBER", "UNIT_LEAD", "ADMIN", "PASTOR", "SUPER_ADMIN"] as const)(
    "accepts %s",
    (role) => {
      expect(normalizeRole(role)).toBe(role);
    },
  );

  it("uppercases lowercase input", () => {
    expect(normalizeRole("admin")).toBe("ADMIN");
  });

  it("rejects unknown roles", () => {
    expect(normalizeRole("guest")).toBeNull();
    expect(normalizeRole("")).toBeNull();
    expect(normalizeRole(null)).toBeNull();
  });
});
