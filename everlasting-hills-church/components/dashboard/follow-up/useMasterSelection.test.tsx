import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MasterListRow } from "@/lib/api/follow-up-pipeline";
import { useMasterSelection } from "./useMasterSelection";

function person(id: string, kind: MasterListRow["kind"] = "MEMBER"): MasterListRow {
  return {
    id,
    kind,
    name: `Person ${id}`,
    photoUrl: null,
    assignedTo: null,
    status: "FIRST_TIMER",
    hasAccount: kind === "MEMBER",
    attended: 0,
  };
}

describe("useMasterSelection", () => {
  it("ticks and unticks one person", () => {
    const { result } = renderHook(() => useMasterSelection());
    const grace = person("1");

    act(() => result.current.toggle(grace));
    expect(result.current.has(grace)).toBe(true);
    expect(result.current.count).toBe(1);

    act(() => result.current.toggle(grace));
    expect(result.current.has(grace)).toBe(false);
    expect(result.current.people).toEqual([]);
  });

  it("keeps a visitor and a member apart even when they share an id", () => {
    const { result } = renderHook(() => useMasterSelection());
    const asMember = person("same");
    const asVisitor = person("same", "VISITOR");

    act(() => result.current.toggle(asMember));
    expect(result.current.has(asVisitor)).toBe(false);
    expect(result.current.count).toBe(1);
  });

  it("selects and clears a whole page without losing ticks from another page", () => {
    const { result } = renderHook(() => useMasterSelection());
    const pageOne = [person("1"), person("2")];
    const pageTwo = [person("3")];

    act(() => result.current.toggle(pageTwo[0]));
    act(() => result.current.toggleAll(pageOne, true));
    expect(result.current.count).toBe(3);

    act(() => result.current.toggleAll(pageOne, false));
    expect(result.current.people.map((p) => p.id)).toEqual(["3"]);

    act(() => result.current.clear());
    expect(result.current.count).toBe(0);
  });
});
