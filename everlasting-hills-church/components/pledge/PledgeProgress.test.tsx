import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAddPledgeInstallment, type Pledge } from "@/lib/api/pledges";
import PledgeProgress from "./PledgeProgress";

vi.mock("@/lib/api/pledges", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/pledges")>()),
  useAddPledgeInstallment: vi.fn(),
}));

const mutateAsync = vi.fn();
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
    {
      id: "installment-1",
      amount: 50_000,
      givenOn: "2026-09-01",
      note: "Transfer",
      createdAt: "2026-09-01T10:00:00.000Z",
    },
  ],
  amountGiven: 50_000,
  balance: 150_000,
  progressPercent: 25,
  createdAt: "2026-08-20T10:00:00.000Z",
  updatedAt: "2026-09-01T10:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAddPledgeInstallment).mockReturnValue({
    mutateAsync,
    isPending: false,
    isError: false,
    error: null,
  } as never);
});

afterEach(cleanup);

describe("pledge installment progress", () => {
  it("shows the given amount, balance, progress and giving history", () => {
    render(<PledgeProgress pledge={pledge} target={{ access: "member" }} />);

    expect(screen.getByText("25% complete")).toBeInTheDocument();
    expect(screen.getByText("₦150,000")).toBeInTheDocument();
    expect(screen.getByText("Giving history (1)")).toBeInTheDocument();
    expect(screen.getByText("Transfer")).toBeInTheDocument();
  });

  it("records another installment against the member pledge", async () => {
    mutateAsync.mockResolvedValue({
      ...pledge,
      installments: [
        ...pledge.installments,
        { id: "installment-2", amount: 50_000, givenOn: "2026-09-15", note: null, createdAt: "2026-09-15T10:00:00.000Z" },
      ],
      amountGiven: 100_000,
      balance: 100_000,
      progressPercent: 50,
    });
    render(<PledgeProgress pledge={pledge} target={{ access: "member" }} />);

    fireEvent.change(screen.getByLabelText("Date installment was given"), {
      target: { value: "2026-09-15" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Record installment" }));

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({ amount: 50_000, givenOn: "2026-09-15" }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent("new balance is ₦100,000");
  });

  it("does not allow an entry above the outstanding balance", () => {
    render(<PledgeProgress pledge={pledge} target={{ access: "member" }} />);

    fireEvent.change(screen.getByLabelText("Installment amount given"), {
      target: { value: "160000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Record installment" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Only ₦150,000 remains");
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("replaces a missing installment endpoint with a useful message", () => {
    vi.mocked(useAddPledgeInstallment).mockReturnValue({
      mutateAsync,
      isPending: false,
      isError: true,
      error: {
        status: 404,
        message: "Cannot POST /pledges/sound-media/mine/installments",
      },
    } as never);

    render(<PledgeProgress pledge={pledge} target={{ access: "member" }} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Installment tracking is temporarily unavailable. Your payment was not recorded.",
    );
    expect(screen.getByRole("alert")).not.toHaveTextContent("Cannot POST");
  });
});
