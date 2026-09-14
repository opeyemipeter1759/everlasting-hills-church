import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ReadingScreen from "./ReadingScreen";
import {
  useCompleteDay,
  useCompletedDays,
  usePassage,
  usePlanDay,
  useReadingSubscriptions,
  useSetTranslation,
  useTodayReading,
  useTranslations,
  useUncompleteDay,
  type Passage,
  type PlanDay,
  type TodayReading,
} from "@/lib/api/reading-plan";

const navigation = vi.hoisted(() => ({
  params: new URLSearchParams(),
  router: { push: vi.fn(), replace: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation.router,
  useSearchParams: () => navigation.params,
  usePathname: () => "/dashboard/reading",
}));

// Keep the real link builder and child components, while supplying the server
// state explicitly so each subscription can advance independently.
vi.mock("@/lib/api/reading-plan", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api/reading-plan")>(),
  useCompleteDay: vi.fn(),
  useCompletedDays: vi.fn(),
  usePassage: vi.fn(),
  usePlanDay: vi.fn(),
  useReadingSubscriptions: vi.fn(),
  useSetTranslation: vi.fn(),
  useTodayReading: vi.fn(),
  useTranslations: vi.fn(),
  useUncompleteDay: vi.fn(),
}));

const completeDay = vi.fn();
const uncompleteDay = vi.fn();
const retryCompleted = vi.fn();
let plans: Record<string, TodayReading>;
let completedByPlan: Record<string, number[]>;
let defaultSubscriptionId: string;

function planDay(dayIndex: number): PlanDay {
  return {
    dayIndex,
    title: null,
    referenceLabel: "Genesis 1:31–2:2",
    reflectionPrompt: null,
    estimatedMinutes: 2,
    Portions: [{ sequence: 1, label: null, startVerseId: 31, endVerseId: 33, isOptional: false }],
  };
}

function subscription(subscriptionId: string): TodayReading {
  return {
    subscriptionId,
    status: "ACTIVE",
    startedOn: "2026-09-01",
    completedAt: null,
    plan: { id: `plan-${subscriptionId}`, slug: subscriptionId, title: `Plan ${subscriptionId.toUpperCase()}`, durationDays: 3, coverImageUrl: null },
    translation: { id: 1, code: "WEB", name: "World English Bible" },
    timezone: "Africa/Lagos",
    currentDayIndex: 2,
    completedDays: 1,
    currentStreak: 1,
    longestStreak: 1,
    lastReadOn: "2026-09-12",
    reminderHour: null,
    paceDelta: 0,
    completedToday: false,
    day: planDay(2),
  };
}

const passage: Passage = {
  translation: { code: "WEB", name: "World English Bible" },
  reference: "Genesis 1:31–2:2",
  startVerseId: 31,
  endVerseId: 33,
  verses: [
    { verseId: 31, book: "Genesis", chapter: 1, verse: 31, text: "God saw everything that he had made, and, behold, it was very good." },
    { verseId: 32, book: "Genesis", chapter: 2, verse: 1, text: "The heavens, the earth, and all their vast array were finished." },
    { verseId: 33, book: "Genesis", chapter: 2, verse: 2, text: "On the seventh day God finished his work which he had done." },
  ],
};

beforeEach(() => {
  vi.resetAllMocks();
  navigation.params = new URLSearchParams("subscription=b&day=2");
  navigation.router.replace.mockImplementation((href: string) => {
    navigation.params = new URL(href, "https://church.example").searchParams;
  });
  plans = { a: subscription("a"), b: subscription("b"), c: subscription("c") };
  completedByPlan = { a: [2], b: [1], c: [] };
  defaultSubscriptionId = "a";

  vi.mocked(useTodayReading).mockImplementation((id) => ({
    data: plans[id ?? defaultSubscriptionId], isLoading: false, isError: false, refetch: vi.fn(),
  }) as never);
  vi.mocked(useCompletedDays).mockImplementation((id) => ({
    data: { dayIndexes: id ? completedByPlan[id] : [] },
    isLoading: false, isError: false, refetch: retryCompleted,
  }) as never);
  vi.mocked(useReadingSubscriptions).mockImplementation(() => ({
    data: Object.values(plans), isError: false, refetch: vi.fn(),
  }) as never);
  vi.mocked(usePlanDay).mockImplementation((_id, index) => ({
    data: index ? planDay(index) : undefined, isLoading: false, isError: false, refetch: vi.fn(),
  }) as never);
  vi.mocked(usePassage).mockReturnValue({ data: passage, isLoading: false, error: null, refetch: vi.fn() } as never);
  vi.mocked(useTranslations).mockReturnValue({ data: [{ id: 1, code: "WEB", name: "World English Bible", isDefault: true }] } as never);
  vi.mocked(useSetTranslation).mockReturnValue({ isPending: false, isError: false, mutate: vi.fn() } as never);
  completeDay.mockResolvedValue({ currentDayIndex: 3, completedDays: 2, currentStreak: 1 });
  uncompleteDay.mockResolvedValue({ currentDayIndex: 2, completedDays: 0 });
  vi.mocked(useCompleteDay).mockReturnValue({ mutateAsync: completeDay, isPending: false } as never);
  vi.mocked(useUncompleteDay).mockReturnValue({ mutateAsync: uncompleteDay, isPending: false } as never);
});

afterEach(cleanup);

describe("ReadingScreen with multiple plans", () => {
  it("loads the selected plan's completion state and separates the passage into chapters", () => {
    const { rerender } = render(<ReadingScreen />);

    expect(useTodayReading).toHaveBeenCalledWith("b");
    expect(useCompletedDays).toHaveBeenCalledWith("b");
    expect(screen.getByRole("combobox", { name: "Your plans" })).toHaveValue("b");
    expect(screen.getByRole("button", { name: "Mark as read" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Undo" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent))
      .toEqual(["Genesis 1", "Genesis 2"]);
    expect(screen.getByRole("region", { name: "Genesis 2" })).toHaveTextContent(passage.verses[1].text);

    // Day 2 has been read in A, but that must never mark day 2 read in B.
    navigation.params = new URLSearchParams("subscription=a&day=2");
    rerender(<ReadingScreen />);
    expect(useCompletedDays).toHaveBeenLastCalledWith("a");
    expect(screen.getByRole("button", { name: "Undo" })).toBeEnabled();
    navigation.params = new URLSearchParams("subscription=b&day=2");
    rerender(<ReadingScreen />);
    expect(screen.getByRole("button", { name: "Mark as read" })).toBeEnabled();
  });

  it("retains the selected plan in the whole-plan links and both day directions", () => {
    render(<ReadingScreen />);

    for (const link of screen.getAllByRole("link", { name: "Whole plan" })) {
      expect(link).toHaveAttribute("href", "/dashboard/reading/schedule?subscription=b");
    }
    expect(screen.getByRole("link", { name: "Today" })).toHaveAttribute("href", "/dashboard/reading?subscription=b");
    fireEvent.click(screen.getByRole("button", { name: "Previous day" }));
    expect(navigation.router.push).toHaveBeenLastCalledWith("/dashboard/reading?subscription=b&day=1");
    fireEvent.click(screen.getByRole("button", { name: "Next day" }));
    expect(navigation.router.push).toHaveBeenLastCalledWith("/dashboard/reading?subscription=b&day=3");
    fireEvent.change(screen.getByRole("combobox", { name: "Your plans" }), { target: { value: "c" } });
    expect(navigation.router.push).toHaveBeenLastCalledWith("/dashboard/reading?subscription=c");
  });

  it("pins and marks the exact browsed day in B before its progress advances", async () => {
    navigation.params = new URLSearchParams("subscription=b&day=3");
    completeDay.mockImplementation(async () => {
      expect(navigation.router.replace).toHaveBeenCalledWith(
        "/dashboard/reading?subscription=b&day=3", { scroll: false },
      );
      return { currentDayIndex: 2, completedDays: 2, currentStreak: 1 };
    });
    render(<ReadingScreen />);

    expect(usePlanDay).toHaveBeenCalledWith("plan-b", 3);
    fireEvent.click(screen.getByRole("button", { name: "Mark as read" }));
    expect(completeDay).toHaveBeenCalledExactlyOnceWith({ subscriptionId: "b", dayIndex: 3 });
    expect(await screen.findByRole("button", { name: "Undo" })).toBeEnabled();
    expect(screen.getByText("Day 3 of 3")).toBeInTheDocument();
    expect(completedByPlan.a).toEqual([2]);
  });

  it("keeps the finished plan open when another plan becomes the default active plan", async () => {
    navigation.params = new URLSearchParams();
    defaultSubscriptionId = "b";
    plans.b = { ...plans.b, currentDayIndex: 3, completedDays: 2, day: planDay(3) };
    completedByPlan.b = [1, 2];
    completeDay.mockImplementation(async () => {
      expect(navigation.params.get("subscription")).toBe("b");
      expect(navigation.params.get("day")).toBe("3");
      plans.b = { ...plans.b, status: "COMPLETED", completedDays: 3, completedAt: "2026-09-13T12:00:00Z" };
      completedByPlan.b = [1, 2, 3];
      defaultSubscriptionId = "a";
      return { currentDayIndex: 3, completedDays: 3, currentStreak: 2 };
    });
    render(<ReadingScreen />);

    expect(navigation.router.replace).toHaveBeenCalledWith("/dashboard/reading?subscription=b", { scroll: false });
    fireEvent.click(screen.getByRole("button", { name: "Mark as read" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Plan complete. You have read all 3 days.");
    expect(screen.getByRole("combobox", { name: "Your plans" })).toHaveValue("b");
    expect(useTodayReading).toHaveBeenLastCalledWith("b");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Genesis 1:31–2:2");
    expect(screen.getByText("Day 3 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next day" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Undo" })).toBeEnabled();
    expect(navigation.router.push).not.toHaveBeenCalled();
  });

  it.each([
    { days: undefined, button: "Mark as read" },
    { days: [2], button: "Undo" },
  ])("blocks $button when completion state failed to load and offers retry", ({ days, button }) => {
    vi.mocked(useCompletedDays).mockReturnValue({
      data: days ? { dayIndexes: days } : undefined,
      isLoading: false, isError: true, refetch: retryCompleted,
    } as never);
    render(<ReadingScreen />);

    expect(screen.getByRole("alert")).toHaveTextContent("Could not check which days you have read.");
    expect(screen.getByRole("button", { name: button })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: button }));
    expect(completeDay).not.toHaveBeenCalled();
    expect(uncompleteDay).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retryCompleted).toHaveBeenCalledOnce();
  });

  it("keeps a paused plan readable without recording new progress until it is resumed", () => {
    plans.b = { ...plans.b, status: "PAUSED" };
    render(<ReadingScreen />);

    expect(screen.getByText("This plan is paused.", { exact: false })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Resume plan" })).toHaveAttribute(
      "href",
      "/dashboard/reading/overview",
    );
    expect(screen.queryByRole("button", { name: "Mark as read" })).not.toBeInTheDocument();
    expect(completeDay).not.toHaveBeenCalled();
  });

  it("keeps a failed save unread so the member can retry the same plan and day", async () => {
    completeDay.mockRejectedValue(new Error("Could not save your reading."));
    render(<ReadingScreen />);
    fireEvent.click(screen.getByRole("button", { name: "Mark as read" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Could not save your reading."));
    expect(screen.getByRole("button", { name: "Mark as read" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Undo" })).not.toBeInTheDocument();
    expect(navigation.params.get("subscription")).toBe("b");
    expect(navigation.params.get("day")).toBe("2");
  });
});
