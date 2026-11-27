import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
// The open tab lives in the address: ?tab= is read from here, and replaced on a tap.
const nav = vi.hoisted(() => ({ query: "", replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: nav.replace }),
  usePathname: () => "/dashboard/membership-assimilation/u1",
  useSearchParams: () => new URLSearchParams(nav.query),
}));
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

describe("the open Follow Up tab", () => {
  const board = () =>
    render(
      <QueryClientProvider client={new QueryClient()}>
        <FollowUpBoard />
      </QueryClientProvider>,
    );

  it("comes back from the address, so Back from a profile returns to Assigned to me", () => {
    nav.query = "tab=mine";
    board();
    expect(screen.getByRole("tab", { name: /Assigned to me/ }).getAttribute("aria-selected")).toBe("true");
  });

  it("is written to the address when picked", () => {
    nav.query = "";
    board();
    fireEvent.click(screen.getByRole("tab", { name: /Assigned to me/ }));
    expect(nav.replace).toHaveBeenCalledWith("/dashboard/membership-assimilation/u1?tab=mine", { scroll: false });
  });
});
