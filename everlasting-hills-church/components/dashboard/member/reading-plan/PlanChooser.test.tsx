import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PlanChooser from "./PlanChooser";
import {
  useReadingPlans,
  useReadingSubscriptions,
  useShareReadingPlan,
  useSubscribeToPlan,
  useTranslations,
  type ReadingPlanSummary,
  type ReadingSubscription,
} from "@/lib/api/reading-plan";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const navigation = vi.hoisted(() => ({ push: vi.fn(), params: new URLSearchParams() }));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
  useSearchParams: () => navigation.params,
}));

vi.mock("@/hooks/useCurrentUser", () => ({ useCurrentUser: vi.fn() }));

vi.mock("./WordTabs", () => ({ default: () => <nav aria-label="Bible plan navigation" /> }));

vi.mock("@/components/ui/overlay/Modal", () => ({
  default: ({ open, title, children }: { open: boolean; title: string; children: ReactNode }) =>
    open ? <section role="dialog" aria-label={title}>{children}</section> : null,
}));

vi.mock("@/lib/api/reading-plan", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api/reading-plan")>(),
  useReadingPlans: vi.fn(),
  useReadingSubscriptions: vi.fn(),
  useShareReadingPlan: vi.fn(),
  useSubscribeToPlan: vi.fn(),
  useTranslations: vi.fn(),
}));

const subscribe = vi.fn();
const shareMutate = vi.fn();

function signedInAs(role: string) {
  vi.mocked(useCurrentUser).mockReturnValue({ email: null, role, fullName: null, picture: null, loggedIn: true });
}
const retryPlans = vi.fn();
const retrySubscriptions = vi.fn();

function plan(id: string): ReadingPlanSummary {
  return {
    id: `plan-${id}`,
    slug: id,
    title: `Plan ${id.toUpperCase()}`,
    subtitle: `Read ${id}`,
    description: `A plan for ${id}`,
    track: "GROWING",
    durationDays: 30,
    avgMinutesPerDay: 8,
    intensity: "MEDIUM",
    coverImageUrl: null,
    version: 1,
  };
}

function subscription(
  id: string,
  overrides: Partial<ReadingSubscription> = {},
): ReadingSubscription {
  return {
    subscriptionId: `subscription-${id}`,
    status: "ACTIVE",
    startedOn: "2026-09-01",
    completedAt: null,
    plan: {
      id: `plan-${id}`,
      slug: id,
      title: `Plan ${id.toUpperCase()}`,
      durationDays: 30,
      coverImageUrl: null,
    },
    translation: { id: 1, code: "WEB", name: "World English Bible" },
    timezone: "Africa/Lagos",
    currentDayIndex: 4,
    completedDays: 3,
    currentStreak: 2,
    longestStreak: 3,
    lastReadOn: "2026-09-12",
    reminderHour: null,
    paceDelta: 0,
    completedToday: false,
    ...overrides,
  };
}

function useSubscriptions(data: ReadingSubscription[]) {
  vi.mocked(useReadingSubscriptions).mockReturnValue({
    data,
    isLoading: false,
    isError: false,
    refetch: retrySubscriptions,
  } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useReadingPlans).mockReturnValue({
    data: [plan("john"), plan("psalms"), plan("proverbs"), plan("mark")],
    isLoading: false,
    isError: false,
    refetch: retryPlans,
  } as never);
  useSubscriptions([]);
  vi.mocked(useTranslations).mockReturnValue({
    data: [{ id: 1, code: "WEB", name: "World English Bible", isDefault: true }],
  } as never);
  subscribe.mockResolvedValue({ id: "subscription-new" });
  vi.mocked(useSubscribeToPlan).mockReturnValue({ mutateAsync: subscribe, isPending: false } as never);
  navigation.params = new URLSearchParams();
  signedInAs("MEMBER");
  shareMutate.mockResolvedValue({ announcementId: "announcement-1", recipients: 312 });
  vi.mocked(useShareReadingPlan).mockReturnValue({ mutateAsync: shareMutate, isPending: false } as never);
});

afterEach(cleanup);

describe("PlanChooser with multiple plans", () => {
  it("keeps three active plans available through their own continue links", () => {
    useSubscriptions([subscription("john"), subscription("psalms"), subscription("proverbs")]);
    render(<PlanChooser />);

    expect(screen.getByRole("link", { name: /3 plans in progress/i })).toHaveAttribute(
      "href",
      "/dashboard/reading/overview",
    );
    for (const id of ["john", "psalms", "proverbs"]) {
      const card = within(screen.getByRole("article", { name: `Plan ${id.toUpperCase()}` }));
      expect(card.getByText("Reading now")).toBeInTheDocument();
      expect(card.getByRole("link", { name: "Continue reading" })).toHaveAttribute(
        "href",
        `/dashboard/reading?subscription=subscription-${id}`,
      );
    }
    expect(screen.getAllByRole("link", { name: "Continue reading" })).toHaveLength(3);
  });

  it("starts a fourth plan without replacing the others and opens the returned subscription", async () => {
    useSubscriptions([subscription("john"), subscription("psalms"), subscription("proverbs")]);
    subscribe.mockResolvedValueOnce({ id: "subscription-mark" });
    render(<PlanChooser />);

    const mark = within(screen.getByRole("article", { name: "Plan MARK" }));
    fireEvent.click(mark.getByRole("button", { name: "Choose this plan" }));

    const dialog = screen.getByRole("dialog", { name: "Start your Bible plan" });
    expect(within(dialog).getByText(/Your other plans stay active, each with its own progress/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Start reading" }));

    await waitFor(() => expect(subscribe).toHaveBeenCalledOnce());
    expect(subscribe).toHaveBeenCalledWith(expect.objectContaining({
      planId: "plan-mark",
      translationCode: "WEB",
    }));
    expect(navigation.push).toHaveBeenCalledWith(
      "/dashboard/reading?subscription=subscription-mark",
    );
    expect(screen.getAllByRole("link", { name: "Continue reading" })).toHaveLength(3);
  });

  it("offers to resume a paused plan with its saved day and completed effort", async () => {
    useSubscriptions([
      subscription("john"),
      subscription("psalms"),
      subscription("mark", {
        subscriptionId: "subscription-mark-paused",
        status: "PAUSED",
        currentDayIndex: 12,
        completedDays: 11,
        translation: { id: 2, code: "KJV", name: "King James Version" },
      }),
    ]);
    subscribe.mockResolvedValueOnce({ id: "subscription-mark-paused" });
    render(<PlanChooser />);

    const mark = within(screen.getByRole("article", { name: "Plan MARK" }));
    expect(mark.getByText(/Paused/)).toHaveTextContent("11 days read");
    fireEvent.click(mark.getByRole("button", { name: "Resume this plan" }));

    const dialog = screen.getByRole("dialog", { name: "Resume your Bible plan" });
    expect(within(dialog).getByText(/Continue from day 12/)).toHaveTextContent(
      "with your 11 completed days saved",
    );
    expect(within(dialog).queryByRole("combobox", { name: "Bible translation" })).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Resume reading" }));

    await waitFor(() => expect(subscribe).toHaveBeenCalledOnce());
    expect(subscribe).toHaveBeenCalledWith(expect.objectContaining({
      planId: "plan-mark",
      translationCode: "KJV",
    }));
    expect(navigation.push).toHaveBeenCalledWith(
      "/dashboard/reading?subscription=subscription-mark-paused",
    );
  });

  it("blocks starting a plan when current plans fail to load and lets the member retry", () => {
    vi.mocked(useReadingSubscriptions).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: retrySubscriptions,
    } as never);
    render(<PlanChooser />);

    expect(screen.getByRole("alert")).toHaveTextContent("Could not load your current plans.");
    const choose = within(screen.getByRole("article", { name: "Plan MARK" }))
      .getByRole("button", { name: "Choose this plan" });
    expect(choose).toBeDisabled();
    fireEvent.click(choose);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(subscribe).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retrySubscriptions).toHaveBeenCalledOnce();
  });
});

describe("sharing a plan with the church", () => {
  it("keeps the share action away from members", () => {
    render(<PlanChooser />);

    expect(screen.queryByRole("button", { name: /with the church/i })).not.toBeInTheDocument();
  });

  it("lets an admin share a plan with a note and an email, then says how many members were told", async () => {
    signedInAs("ADMIN");
    render(<PlanChooser />);

    fireEvent.click(screen.getByRole("button", { name: "Share Plan PSALMS with the church" }));
    const dialog = screen.getByRole("dialog", { name: "Share with the church" });
    fireEvent.change(within(dialog).getByLabelText(/a note from you/i), { target: { value: "We start together on Monday." } });
    fireEvent.click(within(dialog).getByLabelText(/also email every member/i));
    fireEvent.click(within(dialog).getByRole("button", { name: "Share with the church" }));

    await waitFor(() => expect(shareMutate).toHaveBeenCalledWith({
      planId: "plan-psalms",
      note: "We start together on Monday.",
      sendEmail: true,
    }));
    expect(await screen.findByText("Shared Plan PSALMS with the church. 312 members were notified.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Share with the church" })).not.toBeInTheDocument();
  });

  it("explains a refused share and keeps the dialog open", async () => {
    signedInAs("PASTOR");
    shareMutate.mockRejectedValue({
      status: 409,
      message: "This plan was shared with the church in the last few minutes. Members have already been notified.",
    });
    render(<PlanChooser />);

    fireEvent.click(screen.getByRole("button", { name: "Share Plan JOHN with the church" }));
    const dialog = screen.getByRole("dialog", { name: "Share with the church" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Share with the church" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent("shared with the church in the last few minutes");
    expect(shareMutate).toHaveBeenCalledWith({ planId: "plan-john", note: "", sendEmail: false });
  });

  it("opens a plan shared with the church, ready to start", () => {
    navigation.params = new URLSearchParams({ plan: "proverbs" });
    render(<PlanChooser />);

    const dialog = screen.getByRole("dialog", { name: "Start your Bible plan" });
    expect(within(dialog).getByText("Plan PROVERBS")).toBeInTheDocument();
  });

  it("takes a member already reading a shared plan straight to today's reading", async () => {
    navigation.params = new URLSearchParams({ plan: "psalms" });
    useSubscriptions([subscription("psalms")]);
    render(<PlanChooser />);

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/dashboard/reading?subscription=subscription-psalms"));
    expect(screen.queryByRole("dialog", { name: "Start your Bible plan" })).not.toBeInTheDocument();
  });
});
