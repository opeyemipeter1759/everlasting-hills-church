import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DepartmentRow from "./DepartmentRow";
import { getRequiredRole } from "@/lib/auth/frontend-session";

const mutate = vi.fn();
vi.mock("@/lib/api/service-readiness", () => ({
  useSaveReadinessUnit: () => ({ mutate, isPending: false }),
}));
vi.mock("@/components/ui/toast/toast", () => ({ showToast: { success: vi.fn(), error: vi.fn() } }));

const unit = {
  id: "u-av",
  name: "Audio & Video Streaming",
  department: { id: "d-ops", name: "Operations and Service Management" },
  sundayChecklist: ["Cameras mounted", "Stream key tested"],
  wednesdayChecklist: [],
};

afterEach(() => {
  cleanup();
  mutate.mockReset();
});

describe("Service readiness setup", () => {
  it("is for the Church Administrator: Admin Head and above", () => {
    expect(getRequiredRole("/dashboard/admin/service-readiness")).toBe("ADMIN_HEAD");
  });

  it("saves checklists pasted one check per line, ignoring blank lines", () => {
    render(<DepartmentRow unit={unit} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit checklists" }));
    fireEvent.change(screen.getByLabelText(/Wednesday checklist/), { target: { value: "Laptop charged\n\n  Mics tested  " } });
    fireEvent.click(screen.getByRole("button", { name: "Save checklists" }));
    expect(mutate.mock.calls[0][0]).toMatchObject({ wednesdayChecklist: ["Laptop charged", "Mics tested"] });
  });
});
