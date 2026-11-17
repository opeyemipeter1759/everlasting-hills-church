import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PipelinePage, PipelineQuery } from "@/lib/api/pipeline";
import MasterListPipeline from "./MasterListPipeline";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("year=2026"),
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/dashboard/follow-up",
}));

const row = (visitorId: string, status: string) => ({ visitorId, firstName: visitorId, lastName: "Test", status, visits: 1, memberId: null });
const PAGE = {
  rows: [row("Ada", "FIRST_TIMER"), row("Bola", "SECOND_TIMER"), row("Chi", "INTEGRATED")],
  total: 3,
  counts: { FIRST_TIMER: 1, SECOND_TIMER: 1, THIRD_TIMER: 0, INTEGRATED: 1, OPTED_OUT: 0, all: 3 },
} as unknown as PipelinePage;

const pipelineHook = vi.fn();
vi.mock("@/lib/api/pipeline", async (original) => ({
  ...(await original<typeof import("@/lib/api/pipeline")>()),
  usePipeline: (q: PipelineQuery) => pipelineHook(q),
}));
// The table, toolbar and drawer are covered elsewhere: here, the numbers.
vi.mock("./v2/PeopleTable", () => ({
  PeopleTable: ({ rows }: { rows: { visitorId: string }[] }) => (
    <ul aria-label="people">{rows.map((r) => <li key={r.visitorId}>{r.visitorId}</li>)}</ul>
  ),
}));
vi.mock("./MasterListToolbar", () => ({ MasterListToolbar: () => null, useDebounced: (v: string) => v }));
vi.mock("./PersonDrawer", () => ({ PersonDrawer: () => null }));
vi.mock("./MasterListNotes", () => ({ NotesButton: () => null, useOpenLinkedThread: () => undefined }));
vi.mock("@/components/ui/navigation/Pagination", () => ({ Pagination: () => null }));

beforeEach(() => {
  pipelineHook.mockReset();
  pipelineHook.mockReturnValue({ data: PAGE, isLoading: false, isFetching: false });
});
afterEach(cleanup);

const chipCount = (label: RegExp) => Number(within(screen.getByRole("button", { name: label })).getAllByText(/^\d+$/)[0].textContent);

describe("the Master list on the pipeline", () => {
  it("shows the API's total, equal to the list length and to the sum of the status chips", () => {
    render(<MasterListPipeline />);

    const listed = within(screen.getByRole("list", { name: "people" })).getAllByRole("listitem").length;
    const all = chipCount(/^All/);
    const sum = [/^First timer/, /^Second timer/, /^Third timer/, /^Integrated/, /^Opted out/].reduce((n, l) => n + chipCount(l), 0);

    expect(all).toBe(PAGE.total);
    expect(listed).toBe(PAGE.total);
    expect(sum).toBe(all);
    expect(screen.getByText(/Showing 1 to 3 of 3/)).toBeInTheDocument();
  });

  it("filters by tapping a chip, and keeps the month and year from the address", () => {
    render(<MasterListPipeline />);
    fireEvent.click(screen.getByRole("button", { name: /^Integrated/ }));

    expect(pipelineHook).toHaveBeenLastCalledWith(expect.objectContaining({ status: "INTEGRATED", year: 2026, skip: 0 }));
  });

  it("pins what a tab pins, and drops the chips when the status is fixed", () => {
    render(<MasterListPipeline fixed={{ status: "OPTED_OUT" }} />);
    expect(screen.queryByRole("group", { name: "Filter by status" })).not.toBeInTheDocument();
    expect(pipelineHook).toHaveBeenLastCalledWith(expect.objectContaining({ status: "OPTED_OUT" }));

    cleanup();
    render(<MasterListPipeline fixed={{ assigneeId: "me" }} />);
    expect(pipelineHook).toHaveBeenLastCalledWith(expect.objectContaining({ assigneeId: "me" }));
  });
});
