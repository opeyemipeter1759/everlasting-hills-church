import { describe, expect, it } from "vitest";
import { decideApprovalSchema, firstProblem, requestApprovalSchema } from "./approval-schema";
import { updateRoutingRuleSchema } from "./routing-schema";

describe("approval forms", () => {
  it("asking needs the first-timer and a note for the team leads", () => {
    expect(firstProblem(requestApprovalSchema, { visitorId: "v1" })).toBe("Say how they are doing for the team leads");
    expect(firstProblem(requestApprovalSchema, { visitorId: "v1", note: "   " })).toBe("Say how they are doing for the team leads");
    expect(firstProblem(requestApprovalSchema, { visitorId: "v1", note: "Settled in the choir" })).toBeNull();
    expect(firstProblem(requestApprovalSchema, { visitorId: "v1", note: "x".repeat(1001) })).toMatch(/1,000/);
  });

  it("approving needs no note, asking for changes does", () => {
    expect(firstProblem(decideApprovalSchema, { decision: "APPROVED" })).toBeNull();
    expect(firstProblem(decideApprovalSchema, { decision: "CHANGES_REQUESTED", note: "" })).toBe("Say what still needs to happen");
    expect(firstProblem(decideApprovalSchema, { decision: "CHANGES_REQUESTED", note: "Call once more" })).toBeNull();
  });

  it("a rule edit sends only what changed and fills in nothing else", () => {
    const parsed = updateRoutingRuleSchema.parse({ active: false });
    expect(parsed).toEqual({ active: false });
    expect(firstProblem(updateRoutingRuleSchema, {})).toBe("Nothing to change");
  });
});
