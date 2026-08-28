import { describe, expect, it } from "vitest";
import { toCsv } from "./export-csv";

describe("toCsv", () => {
  it("writes a header from the row keys", () => {
    expect(toCsv([{ label: "Sun", present: 68 }])).toBe("label,present\r\nSun,68");
  });

  it("quotes values that would otherwise split a column", () => {
    // Service names carry commas: "Sunday Service, 16 Aug 2026".
    const csv = toCsv([{ name: "Sunday Service, 16 Aug 2026", total: 74 }]);
    expect(csv).toContain('"Sunday Service, 16 Aug 2026"');
    expect(csv.split("\r\n")[1].split('",')[1]).toBe("74");
  });

  it("doubles inner quotes rather than breaking the field", () => {
    expect(toCsv([{ note: 'he said "amen"' }])).toBe('note\r\n"he said ""amen"""');
  });

  it("keeps newlines inside a single quoted field", () => {
    expect(toCsv([{ note: "line one\nline two" }])).toBe('note\r\n"line one\nline two"');
  });

  it("renders null and undefined as empty cells, not the word null", () => {
    expect(toCsv([{ a: null, b: undefined, c: 0 }])).toBe("a,b,c\r\n,,0");
  });

  it("returns nothing for no rows, so an export button can stay disabled", () => {
    expect(toCsv([])).toBe("");
  });

  it("honours an explicit column list and its headers", () => {
    const csv = toCsv([{ label: "Sun", present: 68, absent: 4 }], [
      { key: "label", header: "Service" },
      { key: "present", header: "Present" },
    ]);
    expect(csv).toBe("Service,Present\r\nSun,68");
  });
});
