import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PrayerWatchScreen from "./PrayerWatchScreen";

const { SLOT, state, query, mutation } = vi.hoisted(() => ({
  SLOT: { id: "s1", label: "First Watch", startTime: "22:00", endTime: "00:00", capacity: 10, spotsLeft: 4 },
  state: { mine: null as unknown, history: [] as unknown[] },
  query: (data: unknown) => ({ data, isLoading: false, isError: false, refetch: () => undefined }),
  mutation: () => ({ mutateAsync: async () => undefined, isPending: false }),
}));

vi.mock("@/lib/fonts/prayer-watch", () => ({ fraunces: { variable: "" } }));
vi.mock("@/lib/api", () => ({ useMe: () => query({ member: { firstName: "Ada", lastName: "Obi", email: "a@x.org", phone: "080" } }) }));
vi.mock("@/lib/api/prayer-watch", () => ({
  usePublicPrayerWatch: () => query({ title: "Prayer Watch", slots: [SLOT] }),
  useMyPrayerSignup: () => query(state.mine),
  useMyPrayerHistory: () => query(state.history),
  useSlotCompanions: () => query(null),
  useSubmitPrayerSignup: mutation,
  useRequestFamilyChange: mutation,
  useAddReflection: mutation,
  myPrayerWatchIcsHref: (id: string) => `/ics/${id}`,
}));

afterEach(() => {
  cleanup();
  state.mine = null;
  state.history = [];
});

const signed = (status: string, extra = {}) => ({
  signup: { id: "u1", status },
  slot: { ...SLOT, whatsappLink: null },
  telegramLink: "https://t.me/x",
  pendingFamilyChangeRequest: null,
  leadsWatch: false,
  ...extra,
});

describe("PrayerWatchScreen", () => {
  it("offers the watch hours when the member has not signed up", () => {
    render(<PrayerWatchScreen />);
    expect(screen.getByRole("radio", { name: /22:00/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm my watch" })).toBeInTheDocument();
    // Their profile already has name, email and phone: nothing extra to ask.
    expect(screen.queryByText(/details are missing/)).not.toBeInTheDocument();
  });

  it("shows a sign-up waiting for approval", () => {
    state.mine = signed("PENDING");
    render(<PrayerWatchScreen />);
    expect(screen.getByText("Awaiting approval")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirm my watch" })).not.toBeInTheDocument();
  });

  it("shows a confirmed watch with the way in, and the report for a leader", () => {
    state.mine = signed("CONFIRMED", { leadsWatch: true });
    render(<PrayerWatchScreen />);
    expect(screen.getByText("You lead this watch")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Join the Telegram channel/ })).toHaveAttribute("href", "https://t.me/x");
    expect(screen.getByRole("link", { name: /Report the watch/ })).toBeInTheDocument();
  });

  it("lists watches already kept", () => {
    state.history = [{ signupId: "p1", watchTitle: "Prayer Watch", watchDate: "2026-11-01", slotLabel: "First Watch", slotTime: "22:00–00:00", reflections: [] }];
    render(<PrayerWatchScreen />);
    expect(screen.getByText("Watches you've kept")).toBeInTheDocument();
  });
});
