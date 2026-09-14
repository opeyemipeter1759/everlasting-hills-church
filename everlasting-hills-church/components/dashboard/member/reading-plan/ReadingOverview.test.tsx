import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ReadingOverview from "./ReadingOverview";
import { useReadingActivity, useReadingSubscriptions, useSetPlanStatus, type ReadingSubscription } from "@/lib/api/reading-plan";

vi.mock("./WordTabs", () => ({ default: () => <nav aria-label="Bible plan navigation" /> }));
vi.mock("@/lib/api/reading-plan", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api/reading-plan")>(),
  useReadingActivity: vi.fn(),
  useReadingSubscriptions: vi.fn(),
  useSetPlanStatus: vi.fn(),
}));

const refetch = vi.fn();
const mutateAsync = vi.fn();

function subscription(id: string, overrides: Partial<ReadingSubscription> = {}): ReadingSubscription {
  return {
    subscriptionId: id,
    status: "ACTIVE",
    startedOn: "2026-09-01",
    completedAt: null,
    plan: { id: `plan-${id}`, slug: id, title: `Plan ${id}`, durationDays: 10, coverImageUrl: null },
    translation: { id: 1, code: "WEB", name: "World English Bible" },
    timezone: "Africa/Lagos",
    currentDayIndex: 3,
    completedDays: 2,
    currentStreak: 2,
    longestStreak: 2,
    lastReadOn: "2026-09-13",
    reminderHour: null,
    paceDelta: 0,
    completedToday: true,
    ...overrides,
  };
}

function useData(data: ReadingSubscription[]) {
  vi.mocked(useReadingSubscriptions).mockReturnValue({ data, isLoading: false, isError: false, refetch } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  mutateAsync.mockResolvedValue({});
  vi.mocked(useSetPlanStatus).mockReturnValue({ mutateAsync, isPending: false } as never);
  // The effort calendar is covered in ReadingActivity.test; here it stays empty.
  vi.mocked(useReadingActivity).mockReturnValue({ data: undefined, isLoading: false, isError: false } as never);
  useData([]);
});

afterEach(cleanup);

describe("ReadingOverview", () => {
  it("shows effort across active, paused, and completed plans without counting overlapping readings as calendar days", () => {
    useData([
      subscription("john", { completedDays: 5, longestStreak: 4 }),
      subscription("psalms", { completedDays: 3, longestStreak: 3 }),
      subscription("proverbs", { completedDays: 0, currentStreak: 0, longestStreak: 0, lastReadOn: null }),
      subscription("romans", { status: "PAUSED", completedDays: 2, longestStreak: 2 }),
      subscription("mark", { status: "COMPLETED", completedDays: 10, longestStreak: 8, completedAt: "2026-09-13T08:00:00Z" }),
    ]);
    render(<ReadingOverview />);

    const effort = within(screen.getByRole("region", { name: "Your reading effort" }));
    const value = (label: string) => within(effort.getByText(label).parentElement!).getByRole("definition");
    expect(value("Readings completed")).toHaveTextContent(/^20$/);
    expect(value("Active plans")).toHaveTextContent(/^3$/);
    expect(value("Completed plans")).toHaveTextContent(/^1$/);
    expect(value("Best streak in one plan")).toHaveTextContent(/^8$/);
    expect(screen.getByText(/Reading in two plans on the same day counts as two readings/)).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Reading now" })).getAllByRole("article")).toHaveLength(3);
    expect(within(screen.getByRole("region", { name: "Paused plans" })).getByRole("article", { name: "Plan romans" })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Completed plans" })).getByRole("article", { name: "Plan mark" })).toBeInTheDocument();
  });

  it("keeps each plan's reading and schedule links attached to its own subscription", () => {
    useData([
      subscription("john", { completedDays: 5 }),
      subscription("psalms"),
      subscription("proverbs"),
      subscription("mark", { status: "COMPLETED", completedDays: 10 }),
    ]);
    render(<ReadingOverview />);

    for (const id of ["john", "psalms", "proverbs"]) {
      const card = within(screen.getByRole("article", { name: `Plan ${id}` }));
      expect(card.getByRole("link", { name: "Continue reading" })).toHaveAttribute("href", `/dashboard/reading?subscription=${id}`);
      expect(card.getByRole("link", { name: "Whole plan" })).toHaveAttribute("href", `/dashboard/reading/schedule?subscription=${id}`);
    }
    const john = within(screen.getByRole("article", { name: "Plan john" }));
    expect(john.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "5");
    expect(john.getByRole("progressbar")).toHaveAttribute("aria-valuemax", "10");
    expect(john.getByText("50%")).toBeInTheDocument();
    const mark = within(screen.getByRole("article", { name: "Plan mark" }));
    expect(mark.getByRole("link", { name: "Read again" })).toHaveAttribute("href", "/dashboard/reading?subscription=mark&day=1");
    expect(mark.queryByRole("button", { name: /Pause/ })).not.toBeInTheDocument();
  });

  it("resumes only the selected paused plan while other plans remain available", async () => {
    useData([subscription("john"), subscription("psalms"), subscription("romans", { status: "PAUSED" })]);
    render(<ReadingOverview />);
    fireEvent.click(screen.getByRole("button", { name: "Resume Plan romans" }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledExactlyOnceWith({ subscriptionId: "romans", status: "ACTIVE" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Plan resumed. Your other plans stay active.");
    expect(screen.getAllByRole("link", { name: "Continue reading" })).toHaveLength(2);
  });

  it("pauses only the selected plan and shows mutation failures in that plan", async () => {
    mutateAsync.mockRejectedValueOnce(new Error("Unable to save your changes."));
    useData([subscription("john"), subscription("psalms")]);
    render(<ReadingOverview />);
    fireEvent.click(screen.getByRole("button", { name: "Pause Plan psalms" }));

    expect(mutateAsync).toHaveBeenCalledExactlyOnceWith({ subscriptionId: "psalms", status: "PAUSED" });
    expect(await within(screen.getByRole("article", { name: "Plan psalms" })).findByRole("alert")).toHaveTextContent("Unable to save your changes.");
    expect(within(screen.getByRole("article", { name: "Plan john" })).queryByRole("alert")).not.toBeInTheDocument();
  });

  it("invites members without plans to start reading", () => {
    render(<ReadingOverview />);
    expect(screen.getByText("Your reading journey starts here")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Choose a plan" })).toHaveAttribute("href", "/dashboard/reading/plans");
    expect(screen.queryByRole("region", { name: "Your reading effort" })).not.toBeInTheDocument();
  });

  it("preserves local reading dates and displays completion timestamps in the plan timezone", () => {
    useData([subscription("mark", {
      status: "COMPLETED", completedDays: 10, lastReadOn: "2026-09-14", completedAt: "2026-09-13T23:30:00Z",
    })]);
    render(<ReadingOverview />);
    const card = within(screen.getByRole("article", { name: "Plan mark" }));
    expect(card.getByText("Last read", { exact: false })).toHaveTextContent("Last read 14 Sept 2026");
    expect(card.getByText("Completed", { selector: "p", exact: false })).toHaveTextContent("Completed 14 Sept 2026");
  });

  it("keeps loading distinct from an empty history", () => {
    vi.mocked(useReadingSubscriptions).mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch } as never);
    render(<ReadingOverview />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading your reading overview");
    expect(screen.queryByText("Your reading journey starts here")).not.toBeInTheDocument();
  });

  it("lets members retry a failed overview request without showing misleading zero progress", () => {
    vi.mocked(useReadingSubscriptions).mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch } as never);
    render(<ReadingOverview />);
    expect(screen.getByRole("alert")).toHaveTextContent("We could not load your reading progress.");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalledOnce();
    expect(screen.queryByRole("region", { name: "Your reading effort" })).not.toBeInTheDocument();
  });
});
