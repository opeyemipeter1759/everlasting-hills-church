import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ProfileDetailsForm from "./ProfileDetailsForm";

const patch = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/axios", () => ({ apiClient: { patch } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));

afterEach(() => {
  cleanup();
  patch.mockReset();
});

const single = { gender: "Female", dateOfBirth: null, weddingAnniversary: null };

describe("marital status", () => {
  it("does not save Married without a wedding date, which would leave them Single", async () => {
    render(<ProfileDetailsForm user={single} />);
    fireEvent.click(screen.getByRole("radio", { name: "married" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Add your wedding date to be shown as married.")).toBeInTheDocument();
    expect(patch).not.toHaveBeenCalled();
  });

  it("saves Married with the wedding date", async () => {
    patch.mockResolvedValue({});
    render(<ProfileDetailsForm user={single} />);
    fireEvent.click(screen.getByRole("radio", { name: "married" }));
    fireEvent.change(screen.getByLabelText(/Wedding anniversary/), { target: { value: "2015-06-20" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(patch).toHaveBeenCalled());
    expect(patch.mock.calls[0][1]).toMatchObject({ weddingAnniversary: "2015-06-20" });
  });
});
