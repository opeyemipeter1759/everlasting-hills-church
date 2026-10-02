import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ReadingMonitor from "./ReadingMonitor";
import {
  useClearGoneQuiet,
  useReadingMonitor,
  useRemoveMemberPlan,
  type ReadingMonitorData,
} from "@/lib/api/admin-reading";
import { useReadingPlans, useShareReadingPlan, type ReadingPlanSummary } from "@/lib/api/reading-plan";

vi.mock("@/lib/api/admin-reading", () => ({
  useReadingMonitor: vi.fn(),
  useClearGoneQuiet: vi.fn(),
  useRemoveMemberPlan: vi.fn(),
}));
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
  stats: { activeMembers: 4, reading: 1, quiet: 1, justStarted: 0, finished: 1, notStarted: 1, readingsThisWeek: 3, plansCompleted: 1 },
  readers: [
    {
      memberId: "m-ada", name: "Ada Reads", photoUrl: null, state: "READING", lastReadOn: "2026-09-14",
      readingsLast7: 3, readingsLast30: 10, currentStreak: 4,
      plans: [{ subscriptionId: "sub-ada", title: "Gospels", status: "ACTIVE", completedDays: 12, durationDays: 30 }],
    },
    {
      memberId: "m-ben", name: "Ben Quiet", photoUrl: null, state: "QUIET", lastReadOn: "2026-09-01",
      readingsLast7: 0, readingsLast30: 2, currentStreak: 0,
      plans: [{ subscriptionId: "sub-ben", title: "Proverbs", status: "PAUSED", completedDays: 5, durationDays: 31 }],
    },
    {
      memberId: "m-cal", name: "Cal Done", photoUrl: null, state: "FINISHED", lastReadOn: "2026-08-20",
      readingsLast7: 0, readingsLast30: 0, currentStreak: 0,
      plans: [{ subscriptionId: "sub-cal", title: "Psalms", status: "COMPLETED", completedDays: 30, durationDays: 30 }],
    },
    {
      memberId: "m-dee", name: "Dee New", photoUrl: null, state: "NOT_STARTED", lastReadOn: null,
      readingsLast7: 0, readingsLast30: 0, currentStreak: 0, plans: [],
    },
  ],
};

const refetch = vi.fn();
const shareMutate = vi.fn();
const clearMutate = vi.fn();
const removeMutate = vi.fn();
const names = () => screen.getAllByRole("listitem").map((row) => within(row).getByRole("link").textContent);
const tile = (label: string) =>
  within(screen.getByRole("group", { name: "Reading at a glance" })).getByRole("button", { name: new RegExp(`^${label}`) });
const chip = (label: string) =>
  within(screen.getByRole("group", { name: "Show" })).getByRole("button", { name: new RegExp(`^${label}`) });

function withData(data: ReadingMonitorData) {
  vi.mocked(useReadingMonitor).mockReturnValue({ data, isLoading: false, isError: false, isFetching: false, refetch } as never);
}

function withClearable(plansToClear: number, members: number) {
  withData({ ...DATA, clearable: { plans: plansToClear, members } });
}

beforeEach(() => {
  clearMutate.mockReset();
  clearMutate.mockResolvedValue({ removedPlans: 3, members: 2 });
  removeMutate.mockReset();
  removeMutate.mockResolvedValue({ id: "sub-ben", status: "ABANDONED" });
  vi.mocked(useClearGoneQuiet).mockReturnValue({ mutateAsync: clearMutate, isPending: false } as never);
  vi.mocked(useRemoveMemberPlan).mockReturnValue({ mutateAsync: removeMutate, isPending: false } as never);
  withData(DATA);
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

  it("leads with the church's numbers, saying which are people and which are days", () => {
    render(<ReadingMonitor />);
    expect(tile("Reading")).toHaveTextContent("1of 4 members read in the last 7 days");
    expect(tile("Days read this week")).toHaveTextContent("3by the 1 person reading");
    expect(tile("Gone quiet")).toHaveTextContent("1");
    expect(tile("Plans finished")).toHaveTextContent("1by 1 member");
  });

  it("shows the people behind a number when its card is pressed", () => {
    render(<ReadingMonitor />);

    fireEvent.click(tile("Gone quiet"));
    expect(names()).toEqual(["Ben Quiet"]);
    expect(tile("Gone quiet")).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(tile("Days read this week"));
    expect(names()).toEqual(["Ada Reads"]);

    fireEvent.click(tile("Plans finished"));
    expect(names()).toEqual(["Cal Done"]);

    fireEvent.click(tile("No plan"));
    expect(names()).toEqual(["Dee New"]);
  });

  it("counts someone who began a plan this week as just started, not gone quiet", () => {
    withData({
      ...DATA,
      stats: { ...DATA.stats, quiet: 0, justStarted: 1 },
      readers: DATA.readers.map((reader) => (reader.memberId === "m-ben" ? { ...reader, state: "NEW" } : reader)),
    });
    render(<ReadingMonitor />);

    expect(tile("Just started")).toHaveTextContent("1");
    expect(tile("Gone quiet")).toHaveTextContent("0");
    fireEvent.click(tile("Just started"));
    expect(names()).toEqual(["Ben Quiet"]);
    expect(screen.getByRole("link", { name: "Ben Quiet" }).closest("li")).toHaveTextContent("Just started");
  });

  it("filters to one group at a time", () => {
    render(<ReadingMonitor />);

    fireEvent.click(chip("No plan"));
    expect(names()).toEqual(["Dee New"]);

    fireEvent.click(chip("Gone quiet"));
    expect(names()).toEqual(["Ben Quiet"]);
    expect(screen.getByText("Showing 1 of 4 active members")).toBeInTheDocument();
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

describe("removing one member's plan", () => {
  it("asks first, then removes the plan and says their history stays", async () => {
    render(<ReadingMonitor />);

    fireEvent.click(screen.getByRole("button", { name: "Remove Proverbs from Ben Quiet" }));
    const dialog = screen.getByRole("dialog", { name: "Remove Proverbs from Ben Quiet?" });
    expect(dialog).toHaveTextContent("The days they have read stay in their history");
    fireEvent.click(within(dialog).getByRole("button", { name: "Remove plan" }));

    await waitFor(() => expect(removeMutate).toHaveBeenCalledWith("sub-ben"));
    expect(await screen.findByText("Removed Proverbs from Ben Quiet. The days they read stay in their history.")).toBeInTheDocument();
  });

  it("keeps the plan when the admin changes their mind", () => {
    render(<ReadingMonitor />);

    fireEvent.click(screen.getByRole("button", { name: "Remove Gospels from Ada Reads" }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "Remove Gospels from Ada Reads?" })).getByRole("button", { name: "Keep it" }));

    expect(removeMutate).not.toHaveBeenCalled();
  });

  it("offers no way to remove a finished plan", () => {
    render(<ReadingMonitor />);

    expect(screen.queryByRole("button", { name: "Remove Psalms from Cal Done" })).not.toBeInTheDocument();
  });
});

describe("clearing gone quiet", () => {
  it("asks first, then removes exactly the number of plans it showed", async () => {
    withClearable(3, 2);
    render(<ReadingMonitor />);

    fireEvent.click(screen.getByRole("button", { name: "Clear gone quiet" }));
    const dialog = screen.getByRole("dialog", { name: "Clear gone quiet?" });
    expect(dialog).toHaveTextContent("This removes 3 plans from 2 members who have read nothing in the last 7 days.");
    expect(dialog).toHaveTextContent("Plans started this week stay.");
    fireEvent.click(within(dialog).getByRole("button", { name: "Remove 3 plans" }));

    await waitFor(() => expect(clearMutate).toHaveBeenCalledWith(3));
    expect(await screen.findByText(/Removed 3 plans from 2 members\./)).toBeInTheDocument();
  });

  it("keeps everything when the admin changes their mind", () => {
    withClearable(3, 2);
    render(<ReadingMonitor />);

    fireEvent.click(screen.getByRole("button", { name: "Clear gone quiet" }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "Clear gone quiet?" })).getByRole("button", { name: "Keep them" }));

    expect(clearMutate).not.toHaveBeenCalled();
  });

  it("is always there to find, and disabled when nobody has gone quiet for over a week", () => {
    withClearable(0, 0);
    render(<ReadingMonitor />);

    expect(screen.getByRole("button", { name: "Clear gone quiet" })).toBeDisabled();
  });

  it("says so when gone quiet changed before the admin confirmed", async () => {
    withClearable(3, 2);
    clearMutate.mockRejectedValue({ status: 409, message: "Gone quiet has changed since this page loaded. Refresh the page and try again." });
    render(<ReadingMonitor />);

    fireEvent.click(screen.getByRole("button", { name: "Clear gone quiet" }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "Clear gone quiet?" })).getByRole("button", { name: "Remove 3 plans" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Gone quiet has changed since this page loaded.");
  });
});
