import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { statusOptionsFor } from "./filter-bits";
import { useFollowUpTabs } from "./useFollowUpTabs";

const lead = vi.hoisted(() => ({ canRunUnit: false }));
vi.mock("./useFollowUpLeadership", () => ({ useFollowUpLeadership: () => lead }));

const values = (scope?: Parameters<typeof statusOptionsFor>[0]) => statusOptionsFor(scope).map((o) => o.value);

describe("Opted out has its own tab", () => {
  it("gives a team member only Assigned to me", () => {
    lead.canRunUnit = false;
    const { result } = renderHook(() => useFollowUpTabs());
    expect(result.current.map((t) => t.label)).toEqual(["Assigned to me"]);
  });

  it("gives whoever runs the unit every tab, Opted out after Assigned to me", () => {
    lead.canRunUnit = true;
    const { result } = renderHook(() => useFollowUpTabs());
    expect(result.current.map((t) => t.label)).toEqual(["Master list", "Overview", "Assigned to me", "Opted out", "Report"]);
  });

  it("is no longer something to filter by, on any board", () => {
    expect(values("FOLLOW_UP")).not.toContain("OPTED_OUT");
    expect(values("INTEGRATION")).not.toContain("OPTED_OUT");
    expect(values("ALL")).not.toContain("OPTED_OUT");
    expect(values("FOLLOW_UP")).toEqual(["FIRST_TIMER", "SECOND_TIMER", "THIRD_TIMER", "FOURTH_TIMER", "AWAY"]);
  });

  it("needs no status filter on the Opted out tab itself", () => {
    expect(values("OPTED_OUT")).toEqual([]);
  });
});
