import { describe, expect, it } from "vitest";
import type { OverviewService } from "@/lib/api/attendance-roll";
import { change, comparedWith, dayMonth, defaultService, lagosToday, longDate, previousCounted, previousOfKind, rollSize, sameKind, share } from "./overview-data";

const hc = (total: number) => ({ men: total, women: 0, boys: 0, girls: 0, children: 0, firstTimers: 0, total, status: "CONFIRMED" as const });
const svc = (id: string, serviceType: OverviewService["serviceType"], date: string, extra: Partial<OverviewService> = {}): OverviewService => ({
  id, name: id, serviceType, date, headcount: null, checkedIn: 0, checkedInByGender: { men: 0, women: 0, unknown: 0 }, absent: 0, ...extra,
});

// Newest first, as the API returns them.
const SERVICES = [
  svc("sun-15", "SUNDAY", "2026-11-15"),
  svc("wed-11", "WEDNESDAY", "2026-11-11", { checkedIn: 12 }),
  svc("sun-8", "SUNDAY", "2026-11-08", { headcount: hc(81) }),
  svc("wed-4", "WEDNESDAY", "2026-11-04", { headcount: hc(46) }),
  svc("sun-1", "SUNDAY", "2026-11-01", { headcount: hc(65) }),
];

describe("overview data", () => {
  it("opens on the newest service with something to show", () => {
    expect(defaultService(SERVICES)?.id).toBe("wed-11");
    expect(defaultService([SERVICES[0]])?.id).toBe("sun-15");
    expect(defaultService([])).toBeUndefined();
  });

  it("compares with the last counted service of the same kind", () => {
    expect(previousCounted(SERVICES, "sun-8")?.id).toBe("sun-1");
    expect(previousCounted(SERVICES, "wed-11")?.id).toBe("wed-4");
    expect(previousCounted(SERVICES, "sun-1")).toBeUndefined();
    expect(previousCounted(SERVICES, "missing")).toBeUndefined();
  });

  it("compares check-ins with the service of the same kind just before, counted or not", () => {
    expect(previousOfKind(SERVICES, "sun-15")?.id).toBe("sun-8");
    expect(previousOfKind(SERVICES, "wed-11")?.id).toBe("wed-4");
    expect(previousOfKind(SERVICES, "sun-1")).toBeUndefined();
  });

  it("lists one kind of service oldest first", () => {
    expect(sameKind(SERVICES, "SUNDAY").map((s) => s.id)).toEqual(["sun-1", "sun-8", "sun-15"]);
    expect(sameKind(SERVICES, "SUNDAY", 2).map((s) => s.id)).toEqual(["sun-8", "sun-15"]);
  });

  it("words changes plainly", () => {
    expect(change(30, 25)).toBe("+5");
    expect(change(25, 30)).toBe("−5");
    expect(change(4, 4)).toBe("no change");
    expect(comparedWith(81, 65, "2026-11-01")).toBe("16 more than on 1 Nov");
    expect(comparedWith(60, 65, "2026-11-01")).toBe("5 fewer than on 1 Nov");
    expect(comparedWith(65, 65, "2026-11-01")).toBe("The same as on 1 Nov");
  });

  it("formats shares, dates and the roll size", () => {
    expect(share(30, 81)).toBe(37);
    expect(share(3, 0)).toBe(0);
    expect(dayMonth("2026-11-08")).toBe("8 Nov");
    expect(longDate("2026-11-08")).toBe("Sunday, 8 November 2026");
    expect(lagosToday(Date.parse("2026-11-08T23:30:00Z"))).toBe("2026-11-09");
    expect(rollSize(svc("a", "SUNDAY", "2026-11-08", { checkedIn: 43, absent: 38 }), 83)).toBe(81);
    expect(rollSize(svc("a", "SUNDAY", "2026-11-08", { checkedIn: 10 }), 83)).toBe(83);
  });
});
