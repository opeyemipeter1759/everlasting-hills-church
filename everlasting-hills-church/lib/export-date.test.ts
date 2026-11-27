import { describe, expect, it } from "vitest";
import { datedFilename, exportDate } from "./export-date";

describe("dated exports", () => {
  it("uses the church's day, not UTC's", () => {
    expect(exportDate(new Date("2026-11-26T23:30:00Z"))).toBe("2026-11-27");
    expect(exportDate(new Date("2026-11-27T10:00:00Z"))).toBe("2026-11-27");
  });

  it("puts the date before the extension", () => {
    const now = new Date("2026-11-27T10:00:00Z");
    expect(datedFilename("people-export", "xlsx", now)).toBe("people-export-2026-11-27.xlsx");
    expect(datedFilename("attendance-sunday-service.csv", undefined, now)).toBe("attendance-sunday-service-2026-11-27.csv");
    expect(datedFilename("", "csv", now)).toBe("export-2026-11-27.csv");
  });
});
