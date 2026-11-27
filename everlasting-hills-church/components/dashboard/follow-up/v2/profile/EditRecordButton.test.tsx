import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EditRecordButton } from "./EditRecordButton";

const state = vi.hoisted(() => ({ canEdit: false }));
vi.mock("@/lib/api/first-timer-profile", () => ({
  useFirstTimerRecord: () => ({ data: { canEdit: state.canEdit, record: { id: "v1", firstName: "Ada", lastName: "Eze", submittedAt: "2026-11-01" } } }),
}));
vi.mock("@/components/dashboard/admin/FirstTimer/EditVisitorModal", () => ({ default: () => null }));

afterEach(cleanup);

describe("Edit details on a first-timer's profile", () => {
  it("shows for someone who may edit them", () => {
    state.canEdit = true;
    render(<EditRecordButton visitorId="v1" onSaved={vi.fn()} />);
    expect(screen.getByRole("button", { name: /edit details/i })).toBeTruthy();
  });

  it("stays hidden for everyone else", () => {
    state.canEdit = false;
    render(<EditRecordButton visitorId="v1" onSaved={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /edit details/i })).toBeNull();
  });
});
