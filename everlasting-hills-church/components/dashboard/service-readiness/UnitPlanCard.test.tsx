import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import UnitPlanCard from "./UnitPlanCard";
import type { MyReadinessItem, ReadinessTask } from "@/lib/api/service-readiness-plans";

const add = vi.fn();
const toggle = vi.fn();
const remove = vi.fn();
const send = vi.fn();
vi.mock("@/lib/api/service-readiness-tasks", () => ({
  useAddReadinessTasks: () => ({ mutate: add, isPending: false }),
  useToggleReadinessTask: () => ({ mutate: toggle, isPending: false }),
  useRemoveReadinessTask: () => ({ mutate: remove, isPending: false }),
}));
vi.mock("@/lib/api/service-readiness-updates", () => ({
  useSendReadinessPlan: () => ({ mutate: send, isPending: false }),
  usePostReadinessUpdate: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@/components/ui/toast/toast", () => ({ showToast: { success: vi.fn(), error: vi.fn() } }));

const item = (tasks: ReadinessTask[], previous: string[] | null = null): MyReadinessItem => ({
  service: { id: "s1", name: "Sunday Service", serviceType: "SUNDAY", scheduledAt: "2026-11-14T23:00:00Z", readyBy: "2026-11-15T06:45:00Z",
    planDue: "2099-11-14T06:45:00Z", inspections: null },
  unit: { id: "u-av", name: "Projection" },
  plan: { state: "NOT_STARTED", tasks, confirmedAt: null, confirmedBy: null, approvedAt: null, approvedBy: null, status: null, blocker: null,
    statusUpdatedAt: null, updates: [] },
  previous,
});
const task = (id: string, title: string, over: Partial<ReadinessTask> = {}): ReadinessTask => ({ id, title, done: false, byAdministrator: false, ...over });

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("a unit leader's service plan", () => {
  it("adds a task typed into the box", () => {
    render(<UnitPlanCard item={item([])} />);
    fireEvent.change(screen.getByLabelText("New task"), { target: { value: "Test the projector" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(add.mock.calls[0][0]).toEqual({ serviceId: "s1", unitId: "u-av", titles: ["Test the projector"] });
  });

  it("copies last Sunday's tasks in one tap", () => {
    render(<UnitPlanCard item={item([], ["Test the projector", "Load the slides"])} />);
    fireEvent.click(screen.getByRole("button", { name: /Copy last Sunday's 2 tasks/ }));
    expect(add.mock.calls[0][0]).toMatchObject({ titles: ["Test the projector", "Load the slides"] });
  });

  it("ticks a task off and shows progress", () => {
    render(<UnitPlanCard item={item([task("t1", "Load the slides", { done: true }), task("t2", "Test the projector")])} />);
    expect(screen.getByText("1 of 2 done")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "Test the projector" }));
    expect(toggle.mock.calls[0][0]).toMatchObject({ taskId: "t2", done: true });
  });

  it("can't remove a task the Administrator added", () => {
    render(<UnitPlanCard item={item([task("t1", "Spare HDMI cable", { byAdministrator: true }), task("t2", "Mine")])} />);
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Remove “Spare HDMI cable”/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Remove “Mine”/ })).toBeInTheDocument();
  });

  it("sends the plan once there are tasks", () => {
    const { unmount } = render(<UnitPlanCard item={item([])} />);
    expect(screen.getByRole("button", { name: "Send plan" })).toBeDisabled();
    unmount();
    render(<UnitPlanCard item={item([task("t1", "Load the slides")])} />);
    fireEvent.click(screen.getByRole("button", { name: "Send plan" }));
    expect(send.mock.calls[0][0]).toEqual({ serviceId: "s1", unitId: "u-av" });
  });
});
