import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import GiftExchangeAdmin from "./GiftExchangeAdmin";
import type { GiftEntry } from "@/lib/api/gift-exchange";

const reject = vi.fn();
const reinstate = vi.fn();
const entry = (id: string, name: string, over: Partial<GiftEntry> = {}): GiftEntry => ({
  id, memberId: `m-${id}`, name, email: `${id}@mail.com`, phone: "08030000000", status: "INTERESTED", rejectionReason: null,
  reviewedAt: null, createdAt: "2026-11-12T10:00:00Z", ...over,
});
const entries = [entry("a", "Ada Obi"), entry("b", "Tunde Bello", { status: "REJECTED", rejectionReason: "Duplicate account" })];
vi.mock("@/lib/api/gift-exchange", () => ({
  useGiftEntries: () => ({
    data: { targetDate: "2026-12-06T00:00:00.000+01:00", counts: { INTERESTED: 1, REJECTED: 1, total: 2 }, entries },
    isLoading: false, isError: false, refetch: vi.fn(),
  }),
  useRejectGiftEntry: () => ({ mutate: reject, isPending: false }),
  useReinstateGiftEntry: () => ({ mutate: reinstate, isPending: false }),
}));
vi.mock("@/components/ui/toast/toast", () => ({ showToast: { success: vi.fn(), error: vi.fn() } }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("the gift exchange admin page", () => {
  it("says when the exchange is and explains who will be paired", () => {
    render(<GiftExchangeAdmin />);
    expect(screen.getByText(/Exchange day: Sunday, 6 December/)).toBeInTheDocument();
    expect(screen.getByText("Will be paired")).toBeInTheDocument();
    expect(screen.getByText(/Rejected: Duplicate account/)).toBeInTheDocument();
  });

  it("rejects with a reason after confirming", () => {
    render(<GiftExchangeAdmin />);
    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    expect(screen.getByText("Reject Ada Obi?")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Reason/), { target: { value: " Not yet a member " } });
    fireEvent.click(screen.getAllByRole("button", { name: "Reject" }).at(-1)!);
    expect(reject.mock.calls[0][0]).toEqual({ id: "a", reason: "Not yet a member" });
  });

  it("reinstates a rejected person", () => {
    render(<GiftExchangeAdmin />);
    fireEvent.click(screen.getByRole("button", { name: /Reinstate/ }));
    expect(reinstate.mock.calls[0][0]).toBe("b");
  });

  it("finds people by name", () => {
    render(<GiftExchangeAdmin />);
    fireEvent.change(screen.getByLabelText(/Search by name/), { target: { value: "tunde" } });
    expect(screen.queryByText("Ada Obi")).not.toBeInTheDocument();
    expect(screen.getByText("Tunde Bello")).toBeInTheDocument();
  });
});
