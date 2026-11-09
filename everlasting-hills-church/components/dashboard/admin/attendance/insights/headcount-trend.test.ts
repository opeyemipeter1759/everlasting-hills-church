import { describe, expect, it } from "vitest";
import type { OverviewService } from "@/lib/api/attendance-roll";
import { trendPoints, trendSummary } from "./headcount-trend";

const hc = (men: number, women: number, children: number) => ({
  men, women, boys: children, girls: 0, children, firstTimers: 0, total: men + women + children, status: "CONFIRMED" as const,
});
const svc = (id: string, serviceType: OverviewService["serviceType"], date: string, h: ReturnType<typeof hc> | null): OverviewService => ({
  id, name: id, serviceType, date, headcount: h, checkedIn: 0, checkedInByGender: { men: 0, women: 0, unknown: 0 }, absent: 0,
});

// Newest first, as the API returns them.
const SERVICES = [
  svc("s3", "SUNDAY", "2026-11-08", hc(30, 44, 7)),
  svc("w1", "WEDNESDAY", "2026-11-04", hc(18, 25, 3)),
  svc("s2", "SUNDAY", "2026-11-01", null),
  svc("s1", "SUNDAY", "2026-10-25", hc(26, 43, 3)),
];

describe("headcount trend", () => {
  it("takes one kind of service, oldest first", () => {
    expect(trendPoints(SERVICES, "SUNDAY").map((s) => s.id)).toEqual(["s1", "s2", "s3"]);
    expect(trendPoints(SERVICES, "SUNDAY", 2).map((s) => s.id)).toEqual(["s2", "s3"]);
    expect(trendPoints(SERVICES, "WEDNESDAY").map((s) => s.id)).toEqual(["w1"]);
  });

  it("averages only the services the ushers counted", () => {
    expect(trendSummary(trendPoints(SERVICES, "SUNDAY"))).toEqual({
      counted: 2,
      average: 77,
      highest: { total: 81, date: "2026-11-08" },
      childrenShare: 7,
    });
    expect(trendSummary([SERVICES[2]])).toEqual({ counted: 0, average: 0, highest: null, childrenShare: 0 });
  });
});
