import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ReadingMonitor from "./ReadingMonitor";
import { useReadingPlans } from "@/lib/api/reading-plan";

vi.mock("@/lib/api/admin-reading", () => ({
  useReadingMonitor: () => ({ data: undefined, isLoading: true, isError: false, isFetching: false, refetch: vi.fn() }),
  useClearGoneQuiet: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRemoveMemberPlan: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("@/lib/api/reading-plan", () => ({
  useReadingPlans: vi.fn(() => ({ data: undefined, isLoading: true })),
  useShareReadingPlan: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

afterEach(cleanup);

describe("Reading monitor: sharing a plan", () => {
  it("does not fetch the plan catalogue until Share a plan is opened", () => {
    render(<ReadingMonitor />);
    expect(vi.mocked(useReadingPlans)).toHaveBeenLastCalledWith(undefined, { enabled: false });

    fireEvent.click(screen.getByRole("button", { name: "Share a plan" }));

    expect(vi.mocked(useReadingPlans)).toHaveBeenLastCalledWith(undefined, { enabled: true });
    expect(screen.getByText("Loading plans…")).toBeInTheDocument();
  });
});
