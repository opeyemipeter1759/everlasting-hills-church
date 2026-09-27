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
});
