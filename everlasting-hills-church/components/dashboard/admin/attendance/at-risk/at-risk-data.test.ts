import { describe, expect, it } from "vitest";
import type { MembersAtRisk } from "@/lib/api/members-at-risk";
import { countByReason, filterRiskRows, shortDate, toRiskRows, weeksAgo } from "./at-risk-data";

const person = (userName: string, lastSeen: string | null) => ({ userId: userName, userName, photoUrl: null, phone: null, lastSeen });
const DATA: MembersAtRisk = {
  absentConsecutiveWeeks: [{ ...person("Oluwadara Onakomaiya", "2026-09-09"), consecutiveAbsences: 12, presentCount: 0, totalCount: 8 }],
  neverAttended: [{ ...person("Jesujoba Taiwo", null), joinedAt: "2026-08-21", sundaysSinceJoining: 12 }],
  belowFiftyPercent: [{ ...person("Gbemisola Oni", "2026-11-08"), presentCount: 2, totalCount: 8, rate: 0.25 }],
  window: { sundays: 8, from: "2026-09-20", to: "2026-11-08" },
};

describe("at-risk rows", () => {
  it("puts everyone in one list, most serious first, with a plain reason", () => {
    const rows = toRiskRows(DATA);
    expect(rows.map((r) => [r.userName, r.reason, r.detail])).toEqual([
      ["Oluwadara Onakomaiya", "in-a-row", "Missed the last 12 Sundays"],
      ["Jesujoba Taiwo", "never", "Joined 21 Aug, 12 Sundays ago"],
      ["Gbemisola Oni", "low-rate", "Came to 2 of the last 8 Sundays"],
    ]);
    expect(rows[1]).toMatchObject({ attended: null, eligible: 8 });
    expect(rows[2]).toMatchObject({ attended: 2, eligible: 8 });
    expect(toRiskRows(undefined)).toEqual([]);
  });

  it("filters by reason and by any part of the name", () => {
    const rows = toRiskRows(DATA);
    expect(filterRiskRows(rows, "never", "").map((r) => r.userName)).toEqual(["Jesujoba Taiwo"]);
    expect(filterRiskRows(rows, null, "oni gbem").map((r) => r.userName)).toEqual(["Gbemisola Oni"]);
    expect(countByReason(rows)).toEqual({ "in-a-row": 1, never: 1, "low-rate": 1 });
  });

  it("says when someone last came", () => {
    const now = Date.parse("2026-11-09T12:00:00Z");
    expect(shortDate("2026-10-14")).toBe("14 Oct");
    expect(weeksAgo("2026-09-09", now)).toBe("8 weeks ago");
    expect(weeksAgo("2026-11-01", now)).toBe("1 week ago");
    expect(weeksAgo("2026-11-08", now)).toBe("this week");
  });
});
