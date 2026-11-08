import { describe, expect, it } from "vitest";
import { attendanceStats, EMPTY_FILTERS, filterRows, shortId, toRows, type HistoryResponse } from "./attendance-data";

const DATA: HistoryResponse = {
  member: { name: "Ada Obi", email: "ada@x.org", phone: null },
  records: [
    { id: "r1", serviceName: "Sunday Service", date: "2026-11-01T09:00:00Z", status: "present", mode: "onsite" },
    { id: "r2", serviceName: "Midweek Service", date: "2026-11-04T17:00:00Z", status: "absent", mode: null },
    { id: "r3", serviceName: "Sunday Service", date: "2026-11-08T09:00:00Z", status: "present", mode: "onsite" },
  ],
};

describe("my attendance data", () => {
  it("formats each record for the table", () => {
    const [first, second] = toRows(DATA);
    expect(first).toMatchObject({ name: "Ada Obi", email: "ada@x.org", phone: "—", service: "Sunday Service", date: "Nov 1, 2026", mode: "onsite" });
    expect(second.mode).toBe("--");
    expect(first.id).toBe(shortId("r1"));
    expect(first.id).toMatch(/^\d{4}$/);
  });

  it("filters on every column, ignoring case", () => {
    const rows = toRows(DATA);
    expect(filterRows(rows, { ...EMPTY_FILTERS, service: "sunday" })).toHaveLength(2);
    expect(filterRows(rows, { ...EMPTY_FILTERS, service: "sunday", status: "absent" })).toHaveLength(0);
    expect(filterRows(rows, EMPTY_FILTERS)).toHaveLength(3);
  });

  it("totals present, absent and the rate", () => {
    expect(attendanceStats(toRows(DATA))).toEqual({ total: 3, present: 2, absent: 1, rate: 67 });
    expect(attendanceStats([])).toEqual({ total: 0, present: 0, absent: 0, rate: 0 });
  });
});
