import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import FollowUpBoard from "./FollowUpBoard";

/** What GET /follow-up/counts sends: the total is the sum of byStatus. */
const counts = {
  total: 10,
  byStatus: { FIRST_TIMER: 4, SECOND_TIMER: 2, THIRD_TIMER: 1, INTEGRATED: 2, OPTED_OUT: 1 },
  followingUp: 7,
  assignedToMe: 3,
  unassigned: 2,
  visitors: 10,
  followUp: { newThisWeek: 1, unassigned: 2, quiet: 4 },
};

vi.mock("@/lib/api/follow-up-counts", () => ({
  useFollowUpCounts: () => ({ data: counts, isLoading: false, isFetching: false, dataUpdatedAt: 0, error: null }),
}));
vi.mock("./useFollowUpTabs", () => ({
  useFollowUpTabs: () => [
    { id: "master", label: "Master list", icon: () => null },
    { id: "mine", label: "Assigned to me", icon: () => null },
    { id: "optedOut", label: "Opted out", icon: () => null },
  ],
}));
vi.mock("./FollowUpHeader", () => ({ FollowUpHeader: () => null }));
vi.mock("./MasterListPipeline", () => ({ default: () => null }));
vi.mock("./AssignedToMe", () => ({ default: () => null }));
vi.mock("./FollowUpReport", () => ({ FollowUpReport: () => null }));

afterEach(cleanup);

const badge = (tab: string) => Number(screen.getByRole("tab", { name: new RegExp(tab) }).textContent?.match(/\d+/)?.[0]);

describe("the Follow Up tab badges", () => {
  it("show the API's totals, and the Master list's equals the sum of every status", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <FollowUpBoard />
      </QueryClientProvider>,
    );

    expect(badge("Master list")).toBe(counts.total);
    expect(badge("Master list")).toBe(Object.values(counts.byStatus).reduce((n, c) => n + c, 0));
    expect(badge("Assigned to me")).toBe(counts.assignedToMe);
    expect(badge("Opted out")).toBe(counts.byStatus.OPTED_OUT);
  });
});
