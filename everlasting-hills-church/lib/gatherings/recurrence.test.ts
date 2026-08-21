import { describe, expect, it } from "vitest";
import {
  buildRecurrenceRule,
  describeDays,
  describeSchedule,
  formatDuration,
  formatTime12h,
  parseRecurrenceRule,
} from "./recurrence";

describe("buildRecurrenceRule", () => {
  it("ignores selected days when the frequency is daily", () => {
    // The chips stay in state so switching back to Weekly restores them, but
    // they must not leak into a DAILY rule the backend would reject.
    expect(buildRecurrenceRule({ frequency: "DAILY", byDay: ["MO", "WE"] })).toBe("FREQ=DAILY");
  });

  it("orders days by week position, not by click order", () => {
    // Same selection must always serialise identically, or an untouched
    // schedule shows up as an edit in the audit log.
    expect(buildRecurrenceRule({ frequency: "WEEKLY", byDay: ["TH", "TU"] })).toBe(
      "FREQ=WEEKLY;BYDAY=TU,TH",
    );
    expect(buildRecurrenceRule({ frequency: "WEEKLY", byDay: ["TU", "TH"] })).toBe(
      "FREQ=WEEKLY;BYDAY=TU,TH",
    );
  });

  it("omits BYDAY when no day is chosen, falling back to the anchor weekday", () => {
    expect(buildRecurrenceRule({ frequency: "WEEKLY", byDay: [] })).toBe("FREQ=WEEKLY");
  });
});

describe("parseRecurrenceRule", () => {
  it("round-trips a weekly rule", () => {
    const rule = "FREQ=WEEKLY;BYDAY=TU,TH";
    expect(buildRecurrenceRule(parseRecurrenceRule(rule))).toBe(rule);
  });

  it("reads a daily rule", () => {
    expect(parseRecurrenceRule("FREQ=DAILY")).toEqual({ frequency: "DAILY", byDay: [] });
  });

  it("is case-insensitive", () => {
    expect(parseRecurrenceRule("freq=weekly;byday=mo")).toEqual({
      frequency: "WEEKLY",
      byDay: ["MO"],
    });
  });

  it("drops a weekday code it does not recognise", () => {
    expect(parseRecurrenceRule("FREQ=WEEKLY;BYDAY=MO,XX")).toEqual({
      frequency: "WEEKLY",
      byDay: ["MO"],
    });
  });

  it("falls back to daily for a rule this build cannot render", () => {
    // An old row must still open in the editor so an admin can correct it,
    // rather than throwing and blocking the page.
    expect(parseRecurrenceRule("FREQ=MONTHLY;BYMONTHDAY=1")).toEqual({
      frequency: "DAILY",
      byDay: [],
    });
    expect(parseRecurrenceRule("")).toEqual({ frequency: "DAILY", byDay: [] });
  });
});

describe("formatTime12h", () => {
  it("converts 24-hour wall time to a 12-hour label", () => {
    expect(formatTime12h("05:30")).toBe("5:30 AM");
    expect(formatTime12h("17:00")).toBe("5:00 PM");
  });

  it("renders both midnights as 12, not 0", () => {
    expect(formatTime12h("00:00")).toBe("12:00 AM");
    expect(formatTime12h("12:00")).toBe("12:00 PM");
  });

  it("passes through anything it cannot parse", () => {
    expect(formatTime12h("later")).toBe("later");
  });
});

describe("formatDuration", () => {
  it("keeps sub-hour durations in minutes", () => {
    expect(formatDuration(45)).toBe("45 min");
  });

  it("drops a zero minute remainder", () => {
    expect(formatDuration(60)).toBe("1 hr");
    expect(formatDuration(120)).toBe("2 hr");
  });

  it("shows the remainder when there is one", () => {
    expect(formatDuration(90)).toBe("1 hr 30 min");
  });
});

describe("describeDays", () => {
  it("names a single day in the singular", () => {
    expect(describeDays(["TU"])).toBe("Every Tuesday");
  });

  it("joins two days with 'and'", () => {
    expect(describeDays(["TU", "TH"])).toBe("Every Tuesdays and Thursdays");
  });

  it("collapses the common sets into a phrase", () => {
    expect(describeDays(["MO", "TU", "WE", "TH", "FR"])).toBe("Every weekday");
    expect(describeDays(["SA", "SU"])).toBe("Every weekend");
    expect(describeDays(["SU", "MO", "TU", "WE", "TH", "FR", "SA"])).toBe("Every day");
  });

  it("orders by week position regardless of input order", () => {
    expect(describeDays(["FR", "MO"])).toBe("Every Mondays and Fridays");
  });
});

describe("describeSchedule", () => {
  it("describes a daily gathering", () => {
    expect(describeSchedule("FREQ=DAILY", "05:30", 60)).toBe("Every day · 5:30 AM · 1 hr");
  });

  it("describes a weekly gathering with explicit days", () => {
    expect(describeSchedule("FREQ=WEEKLY;BYDAY=TU,TH", "18:00", 90)).toBe(
      "Every Tuesdays and Thursdays · 6:00 PM · 1 hr 30 min",
    );
  });

  it("uses the anchor date's weekday when the rule has no BYDAY", () => {
    // 2026-08-19 is a Wednesday, which is what "no BYDAY" resolves to.
    expect(describeSchedule("FREQ=WEEKLY", "18:00", 60, "2026-08-19")).toBe(
      "Every Wednesday · 6:00 PM · 1 hr",
    );
  });

  it("degrades to a bare 'Weekly' when it has no anchor to fall back on", () => {
    expect(describeSchedule("FREQ=WEEKLY", "18:00", 60)).toBe("Weekly · 6:00 PM · 1 hr");
  });
});
