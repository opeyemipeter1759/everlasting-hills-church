import { describe, expect, it } from "vitest";
import { canEditFollowUp } from "./useMasterListEditing";

const departments = [
  {
    department: { id: "dept-ma" },
    units: [
      { id: "unit-fu", name: "Follow-Up" },
      { id: "unit-int", name: "Integration Team" },
    ],
  },
  { department: { id: "dept-music" }, units: [{ id: "unit-choir", name: "Choir" }] },
];

describe("who gets the Edit button on the Master List", () => {
  it("the Follow Up unit's lead", () => {
    expect(canEditFollowUp({ unitLeadOf: ["unit-fu"] }, departments)).toBe(true);
  });

  it("the Admin Head of the department Follow Up belongs to", () => {
    expect(canEditFollowUp({ hodOf: ["dept-ma"] }, departments)).toBe(true);
  });

  it("not the lead of another unit, even in the same department", () => {
    expect(canEditFollowUp({ unitLeadOf: ["unit-int"] }, departments)).toBe(false);
    expect(canEditFollowUp({ unitLeadOf: ["unit-choir"] }, departments)).toBe(false);
  });

  it("not the head of another department", () => {
    expect(canEditFollowUp({ hodOf: ["dept-music"] }, departments)).toBe(false);
  });

  it("not an ordinary team member, or anyone before their details load", () => {
    expect(canEditFollowUp({ unitLeadOf: [], hodOf: [] }, departments)).toBe(false);
    expect(canEditFollowUp(undefined, departments)).toBe(false);
    expect(canEditFollowUp({ unitLeadOf: ["unit-fu"] }, [])).toBe(false);
  });
});
