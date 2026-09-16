import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PublicPledgePage from "./PublicPledgePage";

vi.mock("@/components/dashboard/member/member-home/PledgeForm", () => ({
  PLEDGE_INTRO: "Public pledge introduction",
  default: ({ access, onSaved }: { access?: string; onSaved: (value: unknown) => void }) => (
    <button
      type="button"
      data-testid="public-pledge-form"
      data-access={access}
      onClick={() =>
        onSaved({
          id: "public-pledge-1",
          memberId: null,
          fullName: "Ada Visitor",
          phone: "08012345678",
          email: "ada@example.com",
          amount: 100_000,
          method: "ONE_TIME",
          methodOther: null,
          installmentAmount: null,
          completeBy: "2099-12-31",
          contactMe: false,
          createdAt: "2026-09-15T10:00:00.000Z",
          updatedAt: "2026-09-15T10:00:00.000Z",
          installments: [],
          amountGiven: 0,
          balance: 100_000,
          progressPercent: 0,
          trackingToken: "abcdefghijklmnopqrstuvwxyz123456",
        })
      }
    >
      Test public submission
    </button>
  ),
}));

afterEach(cleanup);

describe("public Sound & Media pledge page", () => {
  it("renders the shared form in public mode and confirms an anonymous pledge", () => {
    render(<PublicPledgePage />);

    expect(screen.getByRole("heading", { name: "Financial Pledge Form" })).toBeInTheDocument();
    expect(screen.getByText("Public pledge introduction")).toBeInTheDocument();
    expect(screen.queryByText("A pledge is not an immediate payment")).not.toBeInTheDocument();
    expect(screen.getByTestId("public-pledge-form")).toHaveAttribute("data-access", "public");

    fireEvent.click(screen.getByRole("button", { name: "Test public submission" }));

    expect(screen.getByRole("status")).toHaveTextContent("Thank you, Ada");
    expect(screen.getByRole("status")).toHaveTextContent("₦100,000");
    expect(screen.getByRole("link", { name: "Track my installment giving" })).toHaveAttribute(
      "href",
      "/pledge/track/abcdefghijklmnopqrstuvwxyz123456",
    );
  });
});
