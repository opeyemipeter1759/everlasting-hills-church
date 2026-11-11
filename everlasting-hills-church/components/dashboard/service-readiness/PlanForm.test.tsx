import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PlanForm from "./PlanForm";
import type { MyReadinessItem } from "@/lib/api/service-readiness-plans";

const mutate = vi.fn();
vi.mock("@/lib/api/service-readiness-updates", () => ({ useSaveReadinessPlan: () => ({ mutate, isPending: false }) }));
vi.mock("@/components/ui/toast/toast", () => ({ showToast: { success: vi.fn(), error: vi.fn() } }));

const empty = { workers: null, equipment: null, done: null, outstanding: null, challenges: null, support: null };
const item: MyReadinessItem = {
  service: { id: "s1", name: "Sunday Service", serviceType: "SUNDAY", scheduledAt: "2026-11-14T23:00:00Z", readyBy: "2026-11-15T06:45:00Z", planDue: "2026-11-14T06:45:00Z",
    inspections: { DAY_BEFORE: "2026-11-14T07:00:00Z", ON_THE_DAY: "2026-11-15T05:00:00Z" } },
  unit: { id: "u-av", name: "Audio & Video Streaming" },
  plan: { ...empty, state: "NOT_STARTED", canMeetDeadline: null, confirmedAt: null, confirmedBy: null, approvedAt: null, approvedBy: null,
    status: null, blocker: null, statusUpdatedAt: null, updates: [] },
  roster: ["Ada Obi (Camera)", "Tunde Bello (Switcher)"],
  previous: { ...empty, equipment: "2 cameras, switcher, laptop", workers: "Ada, Tunde" },
};

afterEach(() => {
  cleanup();
  mutate.mockReset();
});

describe("a unit leader's plan", () => {
  it("starts with the workers on the service roster", () => {
    render(<PlanForm item={item} onDone={vi.fn()} />);
    expect(screen.getByLabelText("Workers assigned")).toHaveValue("Ada Obi (Camera)\nTunde Bello (Switcher)");
  });

  it("can start from last Sunday's plan", () => {
    render(<PlanForm item={item} onDone={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Start from last Sunday's plan/ }));
    expect(screen.getByLabelText("Equipment and materials")).toHaveValue("2 cameras, switcher, laptop");
  });

  it("submits the plan for the unit and service", () => {
    render(<PlanForm item={item} onDone={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Submit plan" }));
    expect(mutate.mock.calls[0][0]).toMatchObject({ serviceId: "s1", unitId: "u-av", workers: "Ada Obi (Camera)\nTunde Bello (Switcher)" });
  });
});
