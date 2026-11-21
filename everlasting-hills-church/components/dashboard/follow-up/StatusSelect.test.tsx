import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StatusSelect } from "./StatusSelect";

const state = vi.hoisted(() => ({ status: "SECOND_TIMER", override: null as string | null, canOptOut: false }));
const [setStatus, optOut] = vi.hoisted(() => [vi.fn(), vi.fn()]);
vi.mock("react-hot-toast", () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/api/first-timer-profile", () => ({
  useFirstTimerProfile: () => ({ data: { person: { status: state.status, statusOverride: state.override } } }),
}));
vi.mock("@/lib/api/first-timer-visits", () => ({ useSetFirstTimerStatus: () => ({ mutateAsync: setStatus, isPending: false }) }));
vi.mock("@/lib/api/follow-up-stage", () => ({
  useFollowUpActions: () => ({ data: { canOptOut: state.canOptOut } }),
  useStageAction: () => ({ mutate: optOut, isPending: false }),
}));

const options = () => screen.getAllByRole("option").map((o) => o.textContent);

beforeEach(() => {
  Object.assign(state, { status: "SECOND_TIMER", override: null, canOptOut: false });
  setStatus.mockReset().mockResolvedValue({});
  optOut.mockReset();
});
afterEach(cleanup);

describe("Setting a first-timer's status by hand", () => {
  it("offers every status the team may set, and following their visits", () => {
    render(<StatusSelect visitorId="v1" firstName="Wayne" fallback="FIRST_TIMER" />);
    expect(options()).toEqual(["Follow their visits (Second timer)", "First timer", "Second timer", "Third timer", "Fourth timer", "Away"]);
    expect((screen.getByLabelText("Status") as HTMLSelectElement).value).toBe("FOLLOW_VISITS");
  });

  it("saves a status picked by hand, and clears it to follow their visits again", async () => {
    render(<StatusSelect visitorId="v1" firstName="Wayne" fallback="FIRST_TIMER" />);
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "AWAY" } });
    await waitFor(() => expect(setStatus).toHaveBeenCalledWith("AWAY"));
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "FOLLOW_VISITS" } });
    await waitFor(() => expect(setStatus).toHaveBeenCalledWith(null));
  });

  it("offers Opted out only to those allowed, through the usual Opt out", () => {
    state.canOptOut = true;
    window.confirm = vi.fn(() => true);
    render(<StatusSelect visitorId="v1" firstName="Wayne" fallback="FIRST_TIMER" />);
    expect(options()).toContain("Opted out");
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "OPTED_OUT" } });
    expect(optOut).toHaveBeenCalled();
    expect(setStatus).not.toHaveBeenCalled();
  });

  it("leaves someone integrated to the team leads' approval", () => {
    state.status = "INTEGRATED";
    render(<StatusSelect visitorId="v1" firstName="Wayne" fallback="FIRST_TIMER" />);
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.getByText("Integrated")).toBeTruthy();
  });
});
