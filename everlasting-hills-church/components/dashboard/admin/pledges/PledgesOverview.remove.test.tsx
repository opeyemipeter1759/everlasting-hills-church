import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDeletePledge, usePledges, type Pledge } from "@/lib/api/pledges";
import PledgesOverview from "./PledgesOverview";

vi.mock("@/lib/api/pledges", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/pledges")>()),
  usePledges: vi.fn(),
  useDeletePledge: vi.fn(),
}));

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("@/components/ui/toast/toast", () => ({ showToast: toast }));

const pledge: Pledge = {
  id: "pledge-1",
  memberId: "member-1",
  fullName: "Ada Member",
  phone: "08012345678",
  email: "ada@example.com",
  amount: 200_000,
  method: "MONTHLY",
  methodOther: null,
  installmentAmount: 50_000,
  completeBy: "2099-12-31",
  contactMe: false,
  installments: [
    { id: "i-1", amount: 50_000, givenOn: "2026-09-01", note: null, createdAt: "2026-09-01T10:00:00.000Z" },
  ],
  amountGiven: 50_000,
  balance: 150_000,
  progressPercent: 25,
  createdAt: "2026-08-20T10:00:00.000Z",
  updatedAt: "2026-09-01T10:00:00.000Z",
};

const mutateAsync = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(usePledges).mockReturnValue({
    data: {
      campaign: { key: "sound-media", title: "Sound & Media Project" },
      totals: { pledges: 1, amount: 200_000, amountGiven: 50_000, balance: 150_000, wantContact: 0 },
      pledges: [pledge],
    },
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  } as never);
  vi.mocked(useDeletePledge).mockReturnValue({ mutateAsync, isPending: false } as never);
});

afterEach(cleanup);

describe("removing a pledge from the admin list", () => {
  it("asks first, spelling out what goes with it, and removes only after a yes", async () => {
    mutateAsync.mockResolvedValue({ id: "pledge-1", deleted: true });
    render(<PledgesOverview />);

    fireEvent.click(screen.getByRole("button", { name: "Remove Ada Member's pledge" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("₦200,000");
    expect(dialog).toHaveTextContent("1 installment");
    expect(dialog).toHaveTextContent("cannot be undone");
    expect(mutateAsync).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Remove pledge" }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith("pledge-1"));
    expect(toast.success).toHaveBeenCalledWith("Ada Member's pledge was removed.");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("keeps the dialog open and explains when the removal fails", async () => {
    mutateAsync.mockRejectedValue({ status: 404, message: "Cannot DELETE /pledges/sound-media/pledge-1" });
    render(<PledgesOverview />);

    fireEvent.click(screen.getByRole("button", { name: "Remove Ada Member's pledge" }));
    fireEvent.click(await screen.findByRole("button", { name: "Remove pledge" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(toast.error.mock.calls[0][0]).not.toContain("Cannot DELETE");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does nothing when the leader changes their mind", async () => {
    render(<PledgesOverview />);

    fireEvent.click(screen.getByRole("button", { name: "Remove Ada Member's pledge" }));
    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(mutateAsync).not.toHaveBeenCalled();
  });
});
