import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ProfileDetailsForm from "./ProfileDetailsForm";

const patch = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/axios", () => ({ apiClient: { patch } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
// The member spouse picker has its own tests.
vi.mock("./SpouseLink", () => ({
  SpouseLink: () => <div>Member spouse picker</div>,
  SpouseRequestsInbox: () => null,
}));

afterEach(() => {
  cleanup();
  patch.mockReset();
});

const single = { gender: "Female", dateOfBirth: null, weddingAnniversary: null };

describe("marital status", () => {
  it("saves Married on its own, without a wedding date", async () => {
    patch.mockResolvedValue({});
    render(<ProfileDetailsForm user={single} />);
    fireEvent.click(screen.getByRole("radio", { name: "married" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(patch).toHaveBeenCalled());
    expect(patch.mock.calls[0][1]).toMatchObject({ maritalStatus: "MARRIED", weddingAnniversary: null });
  });

  it("asks who the spouse is: a member by request, or a typed name", async () => {
    patch.mockResolvedValue({});
    render(<ProfileDetailsForm user={single} />);
    fireEvent.click(screen.getByRole("radio", { name: "married" }));
    expect(screen.getByText("Member spouse picker")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "Not a member" }));
    fireEvent.change(screen.getByLabelText(/Spouse's name/), { target: { value: "Funke Adeyemi" } });
    fireEvent.change(screen.getByLabelText(/Wedding anniversary/), { target: { value: "2015-06-20" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(patch).toHaveBeenCalled());
    expect(patch.mock.calls[0][1]).toMatchObject({
      maritalStatus: "MARRIED",
      spouseName: "Funke Adeyemi",
      weddingAnniversary: "2015-06-20",
    });
  });

  it("keeps a married member married, even with no wedding date on file", () => {
    render(<ProfileDetailsForm user={{ ...single, maritalStatus: "MARRIED" }} />);
    expect(screen.getByRole("radio", { name: "married" })).toBeChecked();
  });

  it("saves Single", async () => {
    patch.mockResolvedValue({});
    render(<ProfileDetailsForm user={{ ...single, maritalStatus: "MARRIED" }} />);
    fireEvent.click(screen.getByRole("radio", { name: "single" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(patch).toHaveBeenCalled());
    expect(patch.mock.calls[0][1]).toMatchObject({ maritalStatus: "SINGLE", weddingAnniversary: null });
  });
});
