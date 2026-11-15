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
vi.mock("@/components/ui/toast/toast", () => ({ showToast: { success: vi.fn(), error: vi.fn() } }));

const base: GiftExchangeState = { registered: false, status: null, rejectionReason: null, totalInterested: 12, targetDate: null,
  serverTime: "2026-12-05T22:00:00.000Z", clockOffsetMs: 0 };

beforeEach(() => vi.useFakeTimers({ now: new Date("2026-12-05T22:00:00.000Z") }));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("the gift exchange card", () => {
  it("shows one button and no count or countdown before joining", () => {
    state = base;
    render(<GiftExchangeCard />);
    expect(screen.queryByText(/12/)).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "I'm interested" }));
    expect(register).toHaveBeenCalled();
  });

  it("counts down once in, labelled from the target date, and confirms before withdrawing", () => {
    state = { ...base, registered: true, status: "INTERESTED", targetDate: "2026-12-06T00:00:00.000+01:00" };
    render(<GiftExchangeCard />);
    expect(screen.getByText("Gift exchange begins Sunday, 6 December")).toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveAccessibleName("0 days, 1 hours, 0 minutes left");
    fireEvent.click(screen.getByRole("button", { name: "You're in ✓" }));
    expect(withdraw).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Yes, withdraw/ }));
    expect(withdraw).toHaveBeenCalled();
  });

  it("uses the server's clock, ticks every second, and says the day is here at zero", () => {
    // The device is 59 minutes behind the server, so only a minute is left.
    state = { ...base, status: "INTERESTED", registered: true, targetDate: "2026-12-06T00:00:00.000+01:00", clockOffsetMs: 59 * 60_000 };
    render(<GiftExchangeCard />);
    expect(screen.getByRole("timer")).toHaveAccessibleName("0 days, 0 hours, 1 minutes left");
    act(() => vi.advanceTimersByTime(60_000));
    expect(screen.getByText("The day is here! 🎁")).toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("tells a rejected member, with no button", () => {
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
