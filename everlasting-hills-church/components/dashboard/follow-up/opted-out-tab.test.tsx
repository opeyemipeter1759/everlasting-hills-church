import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { statusOptionsFor } from "./filter-bits";
import { useFollowUpTabs } from "./useFollowUpTabs";

vi.mock("./useFollowUpLeadership", () => ({ useFollowUpLeadership: () => ({ canRunUnit: false }) }));

const values = (scope?: Parameters<typeof statusOptionsFor>[0]) => statusOptionsFor(scope).map((o) => o.value);

describe("Opted out has its own tab", () => {
  it("is a tab for everyone on the team, after Assigned to me", () => {
    const { result } = renderHook(() => useFollowUpTabs());
    expect(result.current.map((t) => t.label)).toEqual(["Master list", "Assigned to me", "Opted out"]);
  });

  it("is no longer something to filter by, on any board", () => {
    expect(values("FOLLOW_UP")).not.toContain("OPTED_OUT");
    expect(values("INTEGRATION")).not.toContain("OPTED_OUT");
    expect(values("ALL")).not.toContain("OPTED_OUT");
    expect(values("FOLLOW_UP")).toEqual(["FIRST_TIMER", "SECOND_TIMER", "THIRD_TIMER", "AWAY"]);
  });

  it("needs no status filter on the Opted out tab itself", () => {
    expect(values("OPTED_OUT")).toEqual([]);
  });
});
