import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { MonthSummary } from "@/lib/api/pipeline";
import { MonthCard } from "./MonthCard";
import { isFutureMonth, monthHref, reachedLong, reachedShort } from "./overview-text";

const january: MonthSummary = {
  month: "2026-01-01",
  total: 50,
  counts: { FIRST_TIMER: 10, SECOND_TIMER: 12, THIRD_TIMER: 15, INTEGRATED: 10, OPTED_OUT: 3 },
  due48: 50,
  reached48: 42,
  tracked: true,
};

afterEach(cleanup);

describe("MonthCard", () => {
  it("shows the total and each status line, which add up to it", () => {
    render(<MonthCard summary={january} title="January" href={monthHref(2026, 1)} />);
    const card = screen.getByRole("link");
    expect(card.getAttribute("href")).toBe("/dashboard/follow-up/overview/2026/01");
    expect(within(card).getByText(/Monthly summary/).textContent).toBe("Monthly summary (50)");
    for (const [label, n] of [["First timer", "10"], ["Second timer", "12"], ["Third timer", "15"], ["Integrated", "10"], ["Opted out", "3"]]) {
      expect(within(card).getByText(label).previousElementSibling?.textContent).toBe(n);
    }
    expect(within(card).getByText("84% reached in 48h")).toBeTruthy();
  });

  it("mutes a month that has not started and makes it not clickable", () => {
    const empty = { ...january, total: 0, counts: { FIRST_TIMER: 0, SECOND_TIMER: 0, THIRD_TIMER: 0, INTEGRATED: 0, OPTED_OUT: 0 }, due48: 0, reached48: 0 };
    render(<MonthCard summary={empty} title="December" href={monthHref(2026, 12)} muted />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Not started yet")).toBeTruthy();
  });
});

describe("the 48-hour line", () => {
  it("says Not tracked, never 0%, for months before contacts were logged", () => {
    const untracked = { ...january, tracked: false, due48: 0, reached48: 0 };
    expect(reachedShort(untracked)).toBe("Not tracked");
    expect(reachedLong(untracked)).toBe("Not tracked");
  });

  it("gives the count and share on the year strip", () => {
    expect(reachedLong({ ...january, due48: 300, reached48: 271 })).toBe("271 of 300 reached within 48 hours (90%)");
  });

  it("treats months after the current Lagos month as the future", () => {
    const now = new Date("2026-01-31T23:30:00Z"); // 00:30 on 1 February in Lagos
    expect(isFutureMonth(2026, 2, now)).toBe(false);
    expect(isFutureMonth(2026, 3, now)).toBe(true);
    expect(isFutureMonth(2025, 12, now)).toBe(false);
  });
});
