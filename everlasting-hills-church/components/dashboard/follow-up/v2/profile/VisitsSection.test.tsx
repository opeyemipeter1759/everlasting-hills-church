import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PipelineRow } from "@/lib/api/pipeline";
import VisitsSection from "./VisitsSection";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("@/lib/api/first-timer-visits", () => ({
  useFirstTimerVisits: () => ({
    data: {
      firstVisitDate: "2026-01-04",
      visitDates: ["2026-01-04", "2026-01-11", "2026-01-18", "2026-01-25"],
      recorded: [
        { date: "2026-01-04", source: "FORM" },
        { date: "2026-01-11", source: "CAME_AGAIN" },
        { date: "2026-01-18", source: "RETURN_FORM" },
      ],
      latestServiceDate: "2026-01-25",
    },
    isLoading: false,
  }),
  useUndoVisit: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCameAgain: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCorrectFirstVisit: () => ({ mutateAsync: vi.fn(), isPending: false }),
  usePossibleReturn: () => ({ data: undefined }),
  useResolvePossibleReturn: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const person = {
  visitorId: "v1",
  firstName: "Ada",
  lastName: "Obi",
  firstVisitDate: "2026-01-04",
  visitDates: ["2026-01-04", "2026-01-11", "2026-01-18", "2026-01-25"],
  visits: 4,
  status: "THIRD_TIMER",
  possibleReturn: false,
} as PipelineRow;

afterEach(cleanup);

describe("VisitsSection", () => {
  it("labels each visit by how it was recorded and offers Undo only on a Came again", () => {
    render(<VisitsSection profile={{ person, answers: {} }} refresh={() => undefined} />);
    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items.map((li) => li.textContent?.replace("Undo", "").trim())).toEqual([
      "4 Jan 2026First visit",
      "11 Jan 2026Came again",
      "18 Jan 2026Filled in the form again",
      "25 Jan 2026Checked in",
    ]);
    expect(screen.getAllByRole("button", { name: /Undo the visit/ })).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Undo the visit on 11 Jan 2026" })).toBeTruthy();
    expect(screen.getByText(/4 visits/)).toBeTruthy();
  });
});
