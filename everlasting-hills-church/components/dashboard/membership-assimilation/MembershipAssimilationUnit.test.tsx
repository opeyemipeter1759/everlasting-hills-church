import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MembershipAssimilationUnit from "./MembershipAssimilationUnit";

const state: { isLoading: boolean; data: unknown[] } = { isLoading: true, data: [] };

vi.mock("next/navigation", () => ({ useParams: () => ({ unitId: "u-1" }) }));
vi.mock("@/lib/api", () => ({ useMyDepartmentUnits: () => state }));
vi.mock("@/components/dashboard/follow-up/FollowUpBoard", () => ({
  default: () => <p>Follow Up board</p>,
}));
vi.mock("@/components/dashboard/integration/IntegrationBoard", () => ({
  default: () => <p>Integration board</p>,
}));

function withUnit(name: string) {
  state.isLoading = false;
  state.data = [{ department: { name: "Membership and Assimilation" }, units: [{ id: "u-1", name }] }];
}

beforeEach(() => {
  state.isLoading = true;
  state.data = [];
});

afterEach(cleanup);

describe("MembershipAssimilationUnit", () => {
  it("shows a skeleton while the units are still loading", () => {
    render(<MembershipAssimilationUnit />);

    expect(screen.getByRole("status", { name: "Loading the page" })).toBeInTheDocument();
    expect(screen.queryByText("Follow Up board")).not.toBeInTheDocument();
  });

  it("opens the right board once the unit is known", () => {
    withUnit("Follow-Up");
    const { rerender } = render(<MembershipAssimilationUnit />);
    expect(screen.getByText("Follow Up board")).toBeInTheDocument();

    withUnit("Integration Team");
    rerender(<MembershipAssimilationUnit />);
    expect(screen.getByText("Integration board")).toBeInTheDocument();
  });

  it("says a unit without a page yet is being built, rather than loading forever", () => {
    withUnit("Ushering");
    render(<MembershipAssimilationUnit />);

    expect(screen.getByText("Ushering")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
