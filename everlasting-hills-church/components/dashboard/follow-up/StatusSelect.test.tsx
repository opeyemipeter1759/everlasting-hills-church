import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StatusSelect } from "./StatusSelect";

const state = vi.hoisted(() => ({ status: "SECOND_TIMER", override: null as string | null, canOptOut: false, stage: null as string | null, onTeam: false }));
const [setStatus, optOut] = vi.hoisted(() => [vi.fn(), vi.fn()]);
vi.mock("react-hot-toast", () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/api/first-timer-profile", () => ({
  useFirstTimerProfile: () => ({ data: { person: { status: state.status, statusOverride: state.override, stage: state.stage } } }),
}));
vi.mock("@/lib/api/first-timer-visits", () => ({ useSetFirstTimerStatus: () => ({ mutateAsync: setStatus, isPending: false }) }));
vi.mock("./useIntegrationTeam", () => ({ useIntegrationTeam: () => ({ unitId: "u1", canAssign: false, onTeam: state.onTeam }) }));
vi.mock("@/lib/api/follow-up-stage", () => ({
  useFollowUpActions: () => ({ data: { canOptOut: state.canOptOut } }),
  useStageAction: () => ({ mutate: optOut, isPending: false }),
}));

const openList = () => fireEvent.click(screen.getByLabelText("Status"));
const options = () => {
  openList();
  const names = screen.getAllByRole("option").map((o) => o.textContent);
  fireEvent.keyDown(screen.getByLabelText("Status"), { key: "Escape" });
  return names;
};
const pickOption = (name: string) => {
  openList();
  fireEvent.click(screen.getByRole("option", { name }));
};

beforeEach(() => {
  Object.assign(state, { status: "SECOND_TIMER", override: null, canOptOut: false, stage: null, onTeam: false });
  setStatus.mockReset().mockResolvedValue({});
  optOut.mockReset();
});
afterEach(cleanup);

describe("Setting a first-timer's status by hand", () => {
  it("offers every status the team may set, and following their visits", () => {
    render(<StatusSelect visitorId="v1" firstName="Wayne" fallback="FIRST_TIMER" />);
    expect(options()).toEqual(["Follow their visits (Second timer)", "First timer", "Second timer", "Third timer", "Fourth timer", "Away"]);
    expect(screen.getByLabelText("Status").textContent).toContain("Follow their visits");
  });

  it("saves a status picked by hand, and clears it to follow their visits again", async () => {
    render(<StatusSelect visitorId="v1" firstName="Wayne" fallback="FIRST_TIMER" />);
    pickOption("Away");
    await waitFor(() => expect(setStatus).toHaveBeenCalledWith("AWAY"));
    pickOption("Follow their visits (Second timer)");
    await waitFor(() => expect(setStatus).toHaveBeenCalledWith(null));
  });

  it("offers Opted out only to those allowed, through the usual Opt out", () => {
    state.canOptOut = true;
    window.confirm = vi.fn(() => true);
    render(<StatusSelect visitorId="v1" firstName="Wayne" fallback="FIRST_TIMER" />);
    expect(options()).toContain("Opted out");
    pickOption("Opted out");
    expect(optOut).toHaveBeenCalled();
    expect(setStatus).not.toHaveBeenCalled();
  });

  it("lets the Integration Team mark an integrated member Away, and back to Integrated", async () => {
    Object.assign(state, { status: "INTEGRATED", stage: "CONFIRMED", onTeam: true });
    render(<StatusSelect visitorId="v1" firstName="Wayne" fallback="FIRST_TIMER" />);
    expect(options()).toEqual(["Integrated", "Away", "EHC Remote Church"]);
    pickOption("Away");
    await waitFor(() => expect(setStatus).toHaveBeenCalledWith("AWAY"));
  });

  it("offers an integrated member marked Away their way back to Integrated", async () => {
    Object.assign(state, { status: "AWAY", override: "AWAY", stage: "CONFIRMED", onTeam: true });
    render(<StatusSelect visitorId="v1" firstName="Wayne" fallback="FIRST_TIMER" />);
    pickOption("Integrated");
    await waitFor(() => expect(setStatus).toHaveBeenCalledWith(null));
  });

  it("moves an integrated member from Away to EHC Remote Church", async () => {
    Object.assign(state, { status: "AWAY", override: "AWAY", stage: "CONFIRMED", onTeam: true });
    render(<StatusSelect visitorId="v1" firstName="Wayne" fallback="FIRST_TIMER" />);
    pickOption("EHC Remote Church");
    await waitFor(() => expect(setStatus).toHaveBeenCalledWith("REMOTE"));
  });

  it("leaves someone integrated to the team leads' approval", () => {
    Object.assign(state, { status: "INTEGRATED", stage: "CONFIRMED", onTeam: false });
    render(<StatusSelect visitorId="v1" firstName="Wayne" fallback="FIRST_TIMER" />);
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.getByText("Integrated")).toBeTruthy();
  });
});
