import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import FirstTimerFunnelCard from "./FirstTimerFunnelCard";

const counts = {
  total: 44,
  byStatus: {
    FIRST_TIMER: 12,
    SECOND_TIMER: 7,
    THIRD_TIMER: 4,
    FOURTH_TIMER: 3,
    AWAY: 2,
    INTEGRATED: 15,
    OPTED_OUT: 1,
  },
  assignedToMe: 2,
  unassigned: 5,
};

vi.mock("@/lib/api/follow-up-counts", () => ({
  useFollowUpCounts: () => ({ data: counts, isLoading: false }),
}));

afterEach(cleanup);

describe("FirstTimerFunnelCard", () => {
  it("states every stage with its count, the stalled ones included", () => {
    render(<FirstTimerFunnelCard />);

    for (const [label, count] of [
      ["First timer", "12"],
      ["Second timer", "7"],
      ["Third timer", "4"],
      ["Fourth timer", "3"],
      ["Away", "2"],
      ["Integrated", "15"],
      ["Opted out", "1"],
    ]) {
      const row = screen.getByText(label).closest("a");
      expect(row).toHaveTextContent(count);
    }
  });

  it("sends each stage to its own list, and offers the whole funnel too", () => {
    render(<FirstTimerFunnelCard />);

    expect(screen.getByText("Integrated").closest("a")).toHaveAttribute(
      "href",
      "/dashboard/admin/first-timers/funnel?status=INTEGRATED",
    );
    expect(screen.getByRole("link", { name: /View everyone's details/ })).toHaveAttribute(
      "href",
      "/dashboard/admin/first-timers/funnel",
    );
  });
});
