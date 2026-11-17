import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FirstTimerProfileData } from "@/lib/api/first-timer-profile";
import type { FollowUpActions } from "@/lib/api/follow-up-stage";
import FollowUpSection from "./FollowUpSection";

let actions: FollowUpActions;
const optOut = vi.fn().mockResolvedValue({});
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/api/follow-up-stage", () => ({
  useFollowUpActions: () => ({ data: actions }),
  useStageAction: (_id: string, action: string) => ({ mutateAsync: action === "opt-out" ? optOut : vi.fn(), isPending: false }),
  useArchiveFirstTimer: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("../../AssigneeCard", () => ({ AssigneeCard: ({ canReassign }: { canReassign: boolean }) => <p>{canReassign ? "can reassign" : "read only"}</p> }));
vi.mock("@/components/ui/overlay/ConfirmDialog", () => ({
  default: ({ open, confirmLabel, onConfirm }: { open: boolean; confirmLabel: string; onConfirm: () => void }) =>
    open ? <button type="button" onClick={onConfirm}>Confirm {confirmLabel}</button> : null,
}));

const profile = {
  person: { visitorId: "v1", firstName: "Ada", stage: "ASSIGNED", assigneeId: "m1", assigneeName: "Ruth", entryId: "e1", unitId: "u1", unitName: "Follow-Up", firstContactedAt: null },
  answers: {},
} as unknown as FirstTimerProfileData;
const none: FollowUpActions = { canReassign: false, canOptOut: false, canRestore: false, canArchive: false, restoreBlockedBy: null };

beforeEach(() => {
  actions = none;
  optOut.mockClear();
});
afterEach(cleanup);

describe("the profile's Follow-up section", () => {
  it("shows the stage, and offers no buttons the API would refuse", () => {
    render(<FollowUpSection profile={profile} refresh={vi.fn()} />);
    expect(screen.getByText("In follow-up")).toBeInTheDocument();
    expect(screen.getByText("read only")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Opt out|Restore|Archive/ })).not.toBeInTheDocument();
  });

  it("opts out after a confirm, then refreshes the profile, lists and counts", async () => {
    actions = { ...none, canOptOut: true, canReassign: true };
    const refresh = vi.fn();
    render(<FollowUpSection profile={profile} refresh={refresh} />);
    fireEvent.click(screen.getByRole("button", { name: /Opt out/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm Opt out" }));
    await vi.waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(optOut).toHaveBeenCalledTimes(1);
  });

  it("offers Archive only to admins, and says why Restore is missing for a deactivated account", () => {
    actions = { ...none, canArchive: true, restoreBlockedBy: "Their account is deactivated." };
    render(<FollowUpSection profile={profile} refresh={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Archive/ })).toBeInTheDocument();
    expect(screen.getByText("Their account is deactivated.")).toBeInTheDocument();
  });
});
