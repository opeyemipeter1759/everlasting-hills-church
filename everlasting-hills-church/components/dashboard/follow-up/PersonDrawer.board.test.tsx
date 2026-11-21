import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PersonDrawer } from "./PersonDrawer";

const mutate = vi.fn();
const teamHook = vi.fn();
vi.mock("@/lib/api/follow-up-pipeline", () => ({
  useFollowUpPerson: () => ({
    data: {
      id: "m1",
      kind: "MEMBER",
      name: "Tunde Bello",
      entryId: "e1",
      assignedTo: { id: "fu", name: "Bola (Follow Up)" },
      integrationAssignedTo: { id: "int", name: "Efe (Integration)" },
    },
    isLoading: false,
  }),
  useAssignFollowUp: () => ({ mutate, isPending: false }),
  useFollowUpTeam: (unitId?: string) => teamHook(unitId),
}));
vi.mock("./useFollowUpLeadership", () => ({ useFollowUpLeadership: () => ({ canRunUnit: false, isHod: false, churchWide: false }) }));
vi.mock("./useIntegrationTeam", () => ({ useIntegrationTeam: () => ({ unitId: "unit-int", canAssign: true }) }));
// The rest of the drawer is covered elsewhere.
vi.mock("./DrawerHeader", () => ({ DrawerHeader: () => null }));
vi.mock("./DrawerFacts", () => ({ DrawerFacts: () => null }));
vi.mock("./ActivityThread", () => ({ ActivityThread: () => null }));
vi.mock("./StatusPicker", () => ({ StatusPicker: () => null }));
vi.mock("./StatusSelect", () => ({ StatusSelect: ({ visitorId }: { visitorId: string }) => <p>Status for {visitorId}</p> }));
vi.mock("./v2/visits/CameAgainButton", () => ({
  CameAgainButton: ({ visitorId, firstName }: { visitorId: string; firstName: string }) => <button type="button">Came again {firstName} {visitorId}</button>,
}));
vi.mock("./TeamPicker", () => ({
  TeamPicker: ({ team, onPick }: { team: { id: string; name: string }[]; onPick: (id: string) => void }) => (
    <button type="button" onClick={() => onPick(team[0].id)}>
      Pick {team[0].name}
    </button>
  ),
}));

const row = {
  id: "m1",
  kind: "MEMBER" as const,
  name: "Tunde Bello",
  photoUrl: null,
  assignedTo: null,
  status: "INTEGRATED" as never,
  hasAccount: true,
  attended: 4,
};

beforeEach(() => {
  vi.clearAllMocks();
  teamHook.mockReturnValue({ data: [{ id: "new-int", name: "Chidi" }], isLoading: false });
});
afterEach(cleanup);

describe("PersonDrawer on each board", () => {
  it("shows Follow Up's assignee on the Follow Up board", () => {
    render(<PersonDrawer person={row} onClose={vi.fn()} />);
    expect(screen.getByText("Bola (Follow Up)")).toBeInTheDocument();
    expect(screen.queryByText("Efe (Integration)")).not.toBeInTheDocument();
    // Only the Follow Up lead reassigns there, and this viewer isn't them.
    expect(screen.queryByRole("button", { name: /Reassign/ })).not.toBeInTheDocument();
  });

  it("shows and changes the Integration Team's own assignee on theirs, from their roster", () => {
    render(<PersonDrawer person={row} onClose={vi.fn()} board="INTEGRATION" />);
    expect(screen.getByText("Efe (Integration)")).toBeInTheDocument();
    expect(screen.queryByText("Bola (Follow Up)")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reassign" }));
    expect(teamHook).toHaveBeenLastCalledWith("unit-int");
    fireEvent.click(screen.getByRole("button", { name: "Pick Chidi" }));
    expect(mutate).toHaveBeenCalledWith(
      { id: "e1", assigneeId: "new-int", team: "INTEGRATION", assigneeName: "Chidi" },
      expect.anything(),
    );
  });

  it("offers no Assign for someone who has opted out: nobody carries them", async () => {
    const pipeline = await import("@/lib/api/follow-up-pipeline");
    const spy = vi.spyOn(pipeline, "useFollowUpPerson").mockReturnValue({
      data: { id: "m1", kind: "MEMBER", name: "Tunde Bello", entryId: "e1", status: "OPTED_OUT", assignedTo: null, integrationAssignedTo: null },
      isLoading: false,
    } as never);
    render(<PersonDrawer person={{ ...row, status: "OPTED_OUT" as never }} onClose={vi.fn()} board="INTEGRATION" />);
    expect(screen.getByText("Nobody yet")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Assign|Reassign/ })).not.toBeInTheDocument();
    spy.mockRestore();
  });

  it("lets a first, second or third timer's return visit be recorded, and their status be set, from Feedback", () => {
    const visitor = { ...row, id: "m1", hasAccount: true, visitorId: "v1", firstVisitDate: "2026-11-01" };
    render(<PersonDrawer person={{ ...visitor, status: "FIRST_TIMER" as never }} onClose={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Came again Tunde v1" })).toBeInTheDocument();
    expect(screen.getByText("Status for v1")).toBeInTheDocument();
    cleanup();
    render(<PersonDrawer person={{ ...visitor, status: "SECOND_TIMER" as never }} onClose={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Came again/ })).toBeInTheDocument();
    cleanup();
    render(<PersonDrawer person={{ ...visitor, status: "THIRD_TIMER" as never }} onClose={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Came again/ })).toBeInTheDocument();
    cleanup();
    render(<PersonDrawer person={{ ...visitor, status: "FOURTH_TIMER" as never }} onClose={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /Came again/ })).not.toBeInTheDocument();
    cleanup();
    // A member with no first-timer form has no visits to add to, and no status to set.
    render(<PersonDrawer person={{ ...row, status: "FIRST_TIMER" as never }} onClose={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /Came again/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/Status for/)).not.toBeInTheDocument();
  });
});
