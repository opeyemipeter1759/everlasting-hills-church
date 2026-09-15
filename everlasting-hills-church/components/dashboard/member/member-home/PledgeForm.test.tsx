import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSubmitPledge } from "@/lib/api/pledges";
import PledgeForm from "./PledgeForm";

vi.mock("@/lib/api/pledges", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/pledges")>()),
  useSubmitPledge: vi.fn(),
}));

const mutateAsync = vi.fn();
const onSaved = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useSubmitPledge).mockReturnValue({
    mutateAsync,
    isPending: false,
    isError: false,
    error: null,
  } as never);
});

afterEach(cleanup);

describe("Financial Pledge Form", () => {
  it("uses the public submission flow when rendered on the public pledge page", () => {
    render(
      <PledgeForm
        existing={null}
        prefill={{ fullName: "", phone: "", email: "" }}
        onSaved={onSaved}
        access="public"
      />,
    );

    expect(useSubmitPledge).toHaveBeenCalledWith(undefined, "public");
  });

  it("requires the member's confirmation before submitting", () => {
    render(
      <PledgeForm
        existing={null}
        prefill={{ fullName: "", phone: "", email: "" }}
        onSaved={onSaved}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Submit my pledge" }));

    expect(screen.getByText("Enter your full name")).toBeInTheDocument();
    expect(screen.getByText("Please tick the pledge confirmation")).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(screen.getByLabelText(/Full Name/));
  });

  it("submits a monthly pledge with the requested timeline and contact choice", async () => {
    const saved = {
      id: "pledge-1",
      memberId: "member-1",
      fullName: "Tomike Kolajo",
      phone: "0810 235 5043",
      email: "tomike@example.com",
      amount: 250_000,
      method: "MONTHLY" as const,
      methodOther: null,
      installmentAmount: 25_000,
      completeBy: "2099-12-31",
      contactMe: true,
      createdAt: "2026-09-15T10:00:00.000Z",
      updatedAt: "2026-09-15T10:00:00.000Z",
    };
    mutateAsync.mockResolvedValue(saved);
    render(
      <PledgeForm
        existing={null}
        prefill={{
          fullName: "Tomike Kolajo",
          phone: "0810 235 5043",
          email: "tomike@example.com",
        }}
        onSaved={onSaved}
      />,
    );

    fireEvent.change(screen.getByLabelText(/How much would you like to pledge/), {
      target: { value: "250000" },
    });
    fireEvent.click(screen.getByLabelText("Monthly installments"));
    fireEvent.change(screen.getByLabelText(/amount do you expect to give per installment/), {
      target: { value: "25000" },
    });
    fireEvent.change(screen.getByLabelText(/expected date for completing/), {
      target: { value: "2099-12-31" },
    });
    fireEvent.click(screen.getByLabelText("Yes"));
    fireEvent.click(screen.getByLabelText(/I confirm that the amount stated above/));
    fireEvent.click(screen.getByRole("button", { name: "Submit my pledge" }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledOnce());
    expect(mutateAsync).toHaveBeenCalledWith({
      fullName: "Tomike Kolajo",
      phone: "0810 235 5043",
      email: "tomike@example.com",
      amount: 250_000,
      method: "MONTHLY",
      installmentAmount: 25_000,
      completeBy: "2099-12-31",
      contactMe: true,
      confirmed: true,
    });
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(saved));
  });
});
