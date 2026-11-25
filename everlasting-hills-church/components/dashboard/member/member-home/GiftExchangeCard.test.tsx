import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GiftExchangeCard } from "./GiftExchangeCard";
import { giftDayLabel, remaining } from "./GiftCountdown";
import type { GiftExchangeState } from "@/lib/api/gift-exchange";

let state: GiftExchangeState | undefined;
const register = vi.fn();
const withdraw = vi.fn();
vi.mock("@/lib/api/gift-exchange", () => ({
  useGiftExchange: () => ({ data: state }),
  useRegisterGiftExchange: () => ({ mutate: register, isPending: false }),
  useWithdrawGiftExchange: () => ({ mutate: withdraw, isPending: false }),
}));
vi.mock("@/lib/api/picnic", () => ({ usePicnicDayLabel: () => "Picnic: date to be announced", usePicnicContent: () => ({ data: null }) }));
vi.mock("@/components/ui/toast/toast", () => ({ showToast: { success: vi.fn(), error: vi.fn() } }));

const TARGET = "2026-12-06T00:00:00.000+01:00";
const base: GiftExchangeState = { registered: false, status: null, giftExchange: false, picnic: false, rejectionReason: null,
  totalInterested: 12, targetDate: TARGET, serverTime: "2026-12-05T22:00:00.000Z", clockOffsetMs: 0 };
const signedUp = (over: Partial<GiftExchangeState> = {}): GiftExchangeState =>
  ({ ...base, registered: true, status: "INTERESTED", giftExchange: true, picnic: true, ...over });

beforeEach(() => vi.useFakeTimers({ now: new Date("2026-12-05T22:00:00.000Z") }));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("the gift exchange & picnic card", () => {
  it("says when it is and lets a member register for either or both from a modal, with no count or countdown yet", () => {
    state = base;
    render(<GiftExchangeCard />);
    expect(screen.getByText("Sunday, 6 December")).toBeInTheDocument();
    expect(screen.queryByText(/12/)).not.toBeInTheDocument();
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Register" }));
    expect(screen.getByRole("dialog", { name: "Register for the fellowship" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Gift exchange/ })).toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: /Picnic/ }));
    fireEvent.click(screen.getByRole("button", { name: "Count me in" }));
    expect(register.mock.calls[0][0]).toEqual({ giftExchange: true, picnic: true });
  });

  it("won't sign up with nothing ticked", () => {
    state = base;
    render(<GiftExchangeCard />);
    fireEvent.click(screen.getByRole("button", { name: "Register" }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Gift exchange/ }));
    expect(screen.getByRole("button", { name: "Count me in" })).toBeDisabled();
    expect(screen.getByText("Tick at least one to sign up.")).toBeInTheDocument();
  });

  it("shows what they joined, counts down, and confirms before withdrawing", () => {
    state = signedUp({ picnic: false });
    render(<GiftExchangeCard />);
    expect(screen.getByText("Gift exchange")).toBeInTheDocument();
    expect(screen.queryByText("Picnic")).not.toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveAccessibleName("0 days, 1 hours, 0 minutes left");
    fireEvent.click(screen.getByRole("button", { name: "Withdraw" }));
    expect(withdraw).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Yes, withdraw/ }));
    expect(withdraw).toHaveBeenCalled();
  });

  it("changes the choice, starting from what they picked before", () => {
    state = signedUp({ picnic: false });
    render(<GiftExchangeCard />);
    fireEvent.click(screen.getByRole("button", { name: "Change" }));
    expect(screen.getByRole("checkbox", { name: /Gift exchange/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Picnic/ })).not.toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: /Picnic/ }));
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(register.mock.calls[0][0]).toEqual({ giftExchange: true, picnic: true });
  });

  it("includes the gift exchange with the picnic and locks it on", () => {
    state = signedUp({ picnic: false });
    render(<GiftExchangeCard />);
    fireEvent.click(screen.getByRole("button", { name: "Change" }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Gift exchange/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Picnic/ }));
    const gifts = screen.getByRole("checkbox", { name: /Gift exchange/ });
    expect(gifts).toBeChecked();
    expect(gifts).toBeDisabled();
    expect(screen.getByText("Included with the picnic.")).toBeInTheDocument();
  });

  it("uses the server's clock, ticks every second, and says it's today at zero", () => {
    // The device is 59 minutes behind the server, so only a minute is left.
    state = signedUp({ clockOffsetMs: 59 * 60_000 });
    render(<GiftExchangeCard />);
    expect(screen.getByRole("timer")).toHaveAccessibleName("0 days, 0 hours, 1 minutes left");
    act(() => vi.advanceTimersByTime(60_000));
    expect(screen.getByText("Gift partners are revealed today.")).toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("tells a rejected member, with no buttons", () => {
    state = { ...base, registered: true, status: "REJECTED", rejectionReason: "Not yet a member" };
    render(<GiftExchangeCard />);
    expect(screen.getByText(/wasn't accepted this time: Not yet a member/)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("countdown helpers", () => {
  it("splits time left into days, hours, minutes and seconds", () => {
    expect(remaining(((2 * 24 + 3) * 60 + 4) * 60_000 + 5_000)).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5 });
    expect(remaining(-1)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  });

  it("formats the day in Lagos time", () => {
    expect(giftDayLabel("2026-12-05T23:00:00Z")).toBe("Sunday, 6 December");
  });
});
