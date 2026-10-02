// @vitest-environment node
import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-next-path";

describe("safeNextPath", () => {
  it("returns people to the page they were on", () => {
    expect(safeNextPath("/dashboard/pastor/sermons?tab=drafts")).toBe("/dashboard/pastor/sermons?tab=drafts");
    expect(safeNextPath("/dashboard/reading/plans?plan=bible-in-four-months")).toBe(
      "/dashboard/reading/plans?plan=bible-in-four-months",
    );
  });

  it("never sends anyone to another site or back to a login page", () => {
    expect(safeNextPath("https://evil.example")).toBeNull();
    expect(safeNextPath("//evil.example")).toBeNull();
    expect(safeNextPath("/\\evil.example")).toBeNull();
    expect(safeNextPath("/login?next=/dashboard")).toBeNull();
    expect(safeNextPath(null)).toBeNull();
  });

  // Browsers strip tabs and newlines from a URL and read a backslash as a
  // slash, so each of these would become "//evil.example" when followed.
  it("refuses paths a browser would turn into another site", () => {
    expect(safeNextPath("/\t/evil.example")).toBeNull();
    expect(safeNextPath("/\n/evil.example")).toBeNull();
    expect(safeNextPath("/\r/evil.example")).toBeNull();
    expect(safeNextPath("/dashboard/\\/evil.example")).toBeNull();
    expect(new URL("/\t/evil.example", "https://www.everlastinghills.church").host).toBe("evil.example");
  });
});
