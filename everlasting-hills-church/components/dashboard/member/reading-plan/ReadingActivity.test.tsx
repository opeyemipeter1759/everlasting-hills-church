import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ReadingActivity } from "@/lib/api/reading-plan";
import { ReadingActivityView, formatMinutes } from "./ReadingActivity";

// 13 September 2026 is a Sunday, so the 84-day window starts on Monday 22 June
// and the calendar pads one day before it and six after.
function activity(overrides: Partial<ReadingActivity> = {}): ReadingActivity {
  return {
    timezone: "Africa/Lagos",
    from: "2026-06-22",
    today: "2026-09-13",
    days: [
      { date: "2026-09-10", readings: 1 },
      { date: "2026-09-12", readings: 2 },
      { date: "2026-09-13", readings: 4 },
    ],
    totals: { readings: 20, activeDays: 11, activeDaysLast30: 3, minutes: 125 },
    ...overrides,
  };
}

const stat = (label: string) => screen.getByText(label).closest("div") as HTMLElement;

afterEach(cleanup);

describe("ReadingActivityView", () => {
  it("leads with time spent, days read and the last 30 days", () => {
    render(<ReadingActivityView activity={activity()} />);

    expect(within(stat("Time in the Word")).getByText("2 h 5 min")).toBeInTheDocument();
    expect(within(stat("Days you read")).getByText("11")).toBeInTheDocument();
    expect(within(stat("Last 30 days")).getByText("3 of 30")).toBeInTheDocument();
  });

  it("draws every day of the window and caps the shade at three or more readings", () => {
    const { container } = render(<ReadingActivityView activity={activity()} />);
    const level = (date: string) =>
      container.querySelector(`[data-date="${date}"]`)?.getAttribute("data-level");

    expect(container.querySelectorAll("[data-level]")).toHaveLength(84);
    expect(level("2026-09-11")).toBe("0");
    expect(level("2026-09-10")).toBe("1");
    expect(level("2026-09-12")).toBe("2");
    expect(level("2026-09-13")).toBe("3");
    // Padding that completes the first and last weeks is not part of the window.
    expect(level("2026-06-21")).toBeNull();
    expect(level("2026-09-19")).toBeNull();
  });

  it("reads a day out on hover and on tap", () => {
    const { container } = render(<ReadingActivityView activity={activity()} />);

    fireEvent.mouseEnter(container.querySelector('[data-date="2026-09-12"]')!);
    expect(screen.getByRole("status")).toHaveTextContent(/12 Sept?: 2 readings/);

    fireEvent.click(container.querySelector('[data-date="2026-09-11"]')!);
    expect(screen.getByRole("status")).toHaveTextContent(/11 Sept?: no reading/);
  });

  it("lists every day read in a table for screen readers", () => {
    render(<ReadingActivityView activity={activity()} />);

    const table = screen.getByRole("table", { name: /days you read in the last 84 days/i });
    // A header row and one row per day read.
    expect(within(table).getAllByRole("row")).toHaveLength(4);
  });

  it("invites a first reading when there is nothing yet", () => {
    render(
      <ReadingActivityView
        activity={activity({
          days: [],
          totals: { readings: 0, activeDays: 0, activeDaysLast30: 0, minutes: 0 },
        })}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(/first reading will light up/i);
    expect(within(stat("Time in the Word")).getByText("0 min")).toBeInTheDocument();
  });

  it("formats time the way a person would say it", () => {
    expect(formatMinutes(45)).toBe("45 min");
    expect(formatMinutes(60)).toBe("1 h");
    expect(formatMinutes(125)).toBe("2 h 5 min");
  });
});
