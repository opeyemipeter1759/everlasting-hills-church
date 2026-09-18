import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  useMarkWhatsappAdded,
  useWhatsappCommunity,
  type WhatsappCommunityList,
} from "@/lib/api/whatsapp-community";
import WhatsAppCommunityCard from "./WhatsAppCommunityCard";

vi.mock("@/lib/api/whatsapp-community", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/whatsapp-community")>()),
  useWhatsappCommunity: vi.fn(),
  useMarkWhatsappAdded: vi.fn(),
}));

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("@/components/ui/toast/toast", () => ({ showToast: toast }));

const list: WhatsappCommunityList = {
  waiting: [
    {
      id: "visitor-1",
      firstName: "Ada",
      lastName: "Visitor",
      phone: "0810 235 5043",
      email: "ada@example.com",
      submittedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
      whatsappAddedAt: null,
    },
  ],
  added: [],
};

const mutateAsync = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useWhatsappCommunity).mockReturnValue({ data: list, isLoading: false } as never);
  vi.mocked(useMarkWhatsappAdded).mockReturnValue({ mutateAsync, isPending: false } as never);
});

afterEach(cleanup);

describe("the WhatsApp community to-do card", () => {
  it("shows who is waiting, how long, and opens their chat in one tap", () => {
    render(<WhatsAppCommunityCard />);

    expect(screen.getByText("Ada Visitor")).toBeInTheDocument();
    expect(screen.getByText(/asked 3 days ago/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "0810 235 5043" })).toHaveAttribute(
      "href",
      "https://wa.me/2348102355043",
    );
  });

  it("marks a person added and says so", async () => {
    mutateAsync.mockResolvedValue({ id: "visitor-1", added: true });
    render(<WhatsAppCommunityCard />);

    fireEvent.click(screen.getByRole("button", { name: "Added" }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ id: "visitor-1", added: true }));
    expect(toast.success).toHaveBeenCalledWith("Ada marked as added to the community.");
  });

  it("explains a failure in plain words and leaves the person on the list", async () => {
    mutateAsync.mockRejectedValue({ status: 500, message: "Internal server error" });
    render(<WhatsAppCommunityCard />);

    fireEvent.click(screen.getByRole("button", { name: "Added" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(toast.error.mock.calls[0][0]).not.toContain("Internal server error");
    expect(screen.getByText("Ada Visitor")).toBeInTheDocument();
  });

  it("can put someone back on the list who was marked by mistake", async () => {
    vi.mocked(useWhatsappCommunity).mockReturnValue({
      data: {
        waiting: [],
        added: [{ ...list.waiting[0], whatsappAddedAt: new Date().toISOString() }],
      },
      isLoading: false,
    } as never);
    mutateAsync.mockResolvedValue({ id: "visitor-1", added: false });
    render(<WhatsAppCommunityCard />);

    expect(screen.getByText("Everyone who asked has been added.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show recently added" }));
    fireEvent.click(screen.getByRole("button", { name: "Put Ada Visitor back on the list" }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ id: "visitor-1", added: false }));
    expect(toast.success).toHaveBeenCalledWith("Ada is back on the list.");
  });
});
