// @vitest-environment node
import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/middleware";

describe("safeNextPath", () => {
  it("returns people to the page they were on", () => {
    expect(safeNextPath("/dashboard/pastor/sermons?tab=drafts")).toBe("/dashboard/pastor/sermons?tab=drafts");
  });

  it("never sends anyone to another site or back to a login page", () => {
    expect(safeNextPath("https://evil.example")).toBeNull();
    expect(safeNextPath("//evil.example")).toBeNull();
    expect(safeNextPath("/\\evil.example")).toBeNull();
    expect(safeNextPath("/login?next=/dashboard")).toBeNull();
    expect(safeNextPath(null)).toBeNull();
  });
});
