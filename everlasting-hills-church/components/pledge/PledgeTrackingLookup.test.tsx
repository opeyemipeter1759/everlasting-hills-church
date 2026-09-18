import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRequestTrackingLink } from "@/lib/api/pledges";
import PledgeTrackingLookup from "./PledgeTrackingLookup";

vi.mock("@/lib/api/pledges", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/pledges")>()),
  useRequestTrackingLink: vi.fn(),
}));

const mutateAsync = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useRequestTrackingLink).mockReturnValue({ mutateAsync, isPending: false } as never);
});

afterEach(cleanup);

describe("finding a pledge made without an account", () => {
  it("asks for the address and confirms without revealing whether it pledged", async () => {
    mutateAsync.mockResolvedValue({ sent: true });
    render(<PledgeTrackingLookup />);

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Email me my link" }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith("ada@example.com"));
    const confirmation = await screen.findByRole("status");
    expect(confirmation).toHaveTextContent("If a pledge was made with");
    expect(confirmation).toHaveTextContent("ada@example.com");
  });

  it("refuses an address that isn't one, without calling the church", () => {
    render(<PledgeTrackingLookup />);

    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "ada" } });
    fireEvent.click(screen.getByRole("button", { name: "Email me my link" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Enter the email address you pledged with");
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("keeps the form open with a plain message when sending fails", async () => {
    mutateAsync.mockRejectedValue({ status: 429, message: "ThrottlerException: Too Many Requests" });
    render(<PledgeTrackingLookup />);

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Email me my link" }));

    const alert = await screen.findByRole("alert");
    expect(alert).not.toHaveTextContent("ThrottlerException");
    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
  });

  it("points members at their dashboard instead", () => {
    render(<PledgeTrackingLookup />);

    expect(screen.getByRole("link", { name: "dashboard" })).toHaveAttribute("href", "/dashboard");
  });
});
