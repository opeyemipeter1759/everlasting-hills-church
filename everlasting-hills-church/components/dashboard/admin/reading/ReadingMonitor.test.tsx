import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ReadingMonitor from "./ReadingMonitor";
import { useReadingMonitor, type ReadingMonitorData } from "@/lib/api/admin-reading";
import { useReadingPlans, useShareReadingPlan, type ReadingPlanSummary } from "@/lib/api/reading-plan";

vi.mock("@/lib/api/admin-reading", () => ({ useReadingMonitor: vi.fn() }));
vi.mock("@/lib/api/reading-plan", () => ({
  useReadingPlans: vi.fn(),
  useShareReadingPlan: vi.fn(),
}));

const plans: ReadingPlanSummary[] = [
  {
    id: "plan-gospels",
    slug: "gospels",
    title: "Walk with Jesus",
    subtitle: null,
    description: null,
    track: "NEW_BELIEVER",
    durationDays: 30,
    avgMinutesPerDay: 8,
    intensity: "LOW",
    coverImageUrl: null,
    version: 1,
  },
  {
    id: "plan-bible",
    slug: "bible-in-four-months",
    title: "The Bible in Four Months",
    subtitle: null,
    description: null,
    track: "MATURE",
    durationDays: 120,
    avgMinutesPerDay: 34,
    intensity: "HIGH",
    coverImageUrl: null,
    version: 3,
  },
];

const DATA: ReadingMonitorData = {
  today: "2026-09-14",
  stats: { activeMembers: 4, reading: 1, quiet: 1, finished: 1, notStarted: 1, readingsThisWeek: 3, plansCompleted: 1 },
  readers: [
    {
      memberId: "m-ada", name: "Ada Reads", photoUrl: null, state: "READING", lastReadOn: "2026-09-14",
      readingsLast7: 3, readingsLast30: 10, currentStreak: 4,
      plans: [{ title: "Gospels", status: "ACTIVE", completedDays: 12, durationDays: 30 }],
    },
    {
      memberId: "m-ben", name: "Ben Quiet", photoUrl: null, state: "QUIET", lastReadOn: "2026-09-01",
      readingsLast7: 0, readingsLast30: 2, currentStreak: 0,
      plans: [{ title: "Proverbs", status: "PAUSED", completedDays: 5, durationDays: 31 }],
    },
    {
      memberId: "m-cal", name: "Cal Done", photoUrl: null, state: "FINISHED", lastReadOn: "2026-08-20",
      readingsLast7: 0, readingsLast30: 0, currentStreak: 0,
      plans: [{ title: "Psalms", status: "COMPLETED", completedDays: 30, durationDays: 30 }],
    },
    {
      memberId: "m-dee", name: "Dee New", photoUrl: null, state: "NOT_STARTED", lastReadOn: null,
      readingsLast7: 0, readingsLast30: 0, currentStreak: 0, plans: [],
    },
  ],
};

const refetch = vi.fn();
const shareMutate = vi.fn();
const names = () => screen.getAllByRole("listitem").map((row) => within(row).getByRole("link").textContent);
const tile = (label: string) => screen.getByText(label, { selector: "dt" }).parentElement as HTMLElement;

beforeEach(() => {
  vi.mocked(useReadingMonitor).mockReturnValue({ data: DATA, isLoading: false, isError: false, isFetching: false, refetch } as never);
  vi.mocked(useReadingPlans).mockReturnValue({ data: plans, isLoading: false } as never);
  vi.mocked(useShareReadingPlan).mockReturnValue({ mutateAsync: shareMutate, isPending: false } as never);
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ReadingMonitor", () => {
  it("opens on the people who have gone quiet", () => {
    render(<ReadingMonitor />);
    expect(names()).toEqual(["Ben Quiet", "Ada Reads", "Dee New", "Cal Done"]);
  });

  it("leads with the church's numbers", () => {
    render(<ReadingMonitor />);
    expect(within(tile("Reading this week")).getByText("1")).toBeInTheDocument();
    expect(within(tile("Reading this week")).getByText("of 4 active members")).toBeInTheDocument();
    expect(within(tile("Gone quiet")).getByText("1")).toBeInTheDocument();
    expect(within(tile("Readings this week")).getByText("3")).toBeInTheDocument();
  });

  it("filters to one group at a time", () => {
    render(<ReadingMonitor />);

    fireEvent.click(screen.getByRole("button", { name: /^Not started/ }));
    expect(names()).toEqual(["Dee New"]);

    fireEvent.click(screen.getByRole("button", { name: /^Gone quiet/ }));
    expect(names()).toEqual(["Ben Quiet"]);
    expect(screen.getByRole("status")).toHaveTextContent("Showing 1 of 4 active members");
  });

  it("finds a member by name", () => {
    render(<ReadingMonitor />);
    fireEvent.change(screen.getByRole("searchbox", { name: "Search members" }), { target: { value: "ada" } });
    expect(names()).toEqual(["Ada Reads"]);
  });

  it("shows when each person last read, their plans and how far along", () => {
    render(<ReadingMonitor />);
    const row = (name: string) => screen.getByRole("link", { name }).closest("li") as HTMLElement;

    expect(row("Ada Reads")).toHaveTextContent("Last read Today");
    expect(row("Ada Reads")).toHaveTextContent("4-day streak");
    expect(row("Ada Reads")).toHaveTextContent("Gospels40%");
    expect(row("Ben Quiet")).toHaveTextContent(/Last read 1 Sept?/);
    expect(row("Ben Quiet")).toHaveTextContent("paused");
    expect(row("Dee New")).toHaveTextContent("Last read Never");
    expect(row("Dee New")).toHaveTextContent("No plan yet");
  });

  it("links each name to that member's page", () => {
    render(<ReadingMonitor />);
    expect(screen.getByRole("link", { name: "Ben Quiet" })).toHaveAttribute("href", "/dashboard/admin/members/m-ben");
  });

  it("shares a chosen reading plan from the admin page", async () => {
    shareMutate.mockResolvedValue({ announcementId: "announcement-1", recipients: 14 });
    render(<ReadingMonitor />);

    fireEvent.click(screen.getByRole("button", { name: "Share a plan" }));
    const dialog = screen.getByRole("dialog", { name: "Share with the church" });
    fireEvent.click(within(dialog).getByRole("combobox", { name: "Plan" }));
    fireEvent.click(await screen.findByRole("option", { name: /The Bible in Four Months/ }));
    fireEvent.change(within(dialog).getByRole("textbox", { name: /A note from you/ }), {
      target: { value: "We begin together on Monday." },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Share with the church" }));

    expect(shareMutate).toHaveBeenCalledWith({
      planId: "plan-bible",
      note: "We begin together on Monday.",
      sendEmail: false,
    });
    expect(
      await screen.findByText("The Bible in Four Months was shared with 14 members."),
    ).toBeInTheDocument();
  });
});
