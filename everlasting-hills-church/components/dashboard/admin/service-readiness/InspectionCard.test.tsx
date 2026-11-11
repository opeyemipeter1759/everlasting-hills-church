import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import InspectionCard from "./InspectionCard";
import type { InspectionRow } from "@/lib/api/service-readiness-inspections";

const mutate = vi.fn();
vi.mock("@/lib/api/service-readiness-inspections", () => ({ useSaveInspection: () => ({ mutate, isPending: false }) }));
vi.mock("@/components/ui/toast/toast", () => ({ showToast: { success: vi.fn(), error: vi.fn() } }));

const row: InspectionRow = {
  readinessId: "r1", unitId: "u-av", unitName: "Audio & Video Streaming", state: "CONFIRMED", planMissing: false,
  outstanding: "Test the stream", support: "Spare HDMI cable", canMeetDeadline: true, approvedAt: null, status: null, blocker: null,
  checklist: ["Cameras mounted", "Stream key tested"], inspection: null,
};

afterEach(() => {
  cleanup();
  mutate.mockReset();
});

describe("inspecting a department", () => {
  it("shows what the plan still needs at the day-before inspection", () => {
    render(<InspectionCard row={row} serviceId="s1" round="DAY_BEFORE" />);
    expect(screen.getByText(/Needs: Spare HDMI cable · Outstanding: Test the stream/)).toBeInTheDocument();
  });

  it("sends each checklist line as ticked or not, with the note", () => {
    render(<InspectionCard row={row} serviceId="s1" round="ON_THE_DAY" />);
    fireEvent.click(screen.getByLabelText("Cameras mounted"));
    fireEvent.change(screen.getByLabelText("Note for Audio & Video Streaming"), { target: { value: "Stream key expired; Tunde renewing" } });
    fireEvent.click(screen.getByRole("button", { name: "Save inspection" }));
    expect(mutate.mock.calls[0][0]).toMatchObject({
      unitId: "u-av",
      checks: [{ label: "Cameras mounted", passed: true }, { label: "Stream key tested", passed: false }],
      note: "Stream key expired; Tunde renewing",
    });
  });
});
