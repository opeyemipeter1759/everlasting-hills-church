import { describe, expect, it } from "vitest";
import { isFollowUpUnit, isIntegrationUnit } from "./integration-unit";

describe("unit names", () => {
  it("recognises however an admin has typed Follow Up", () => {
    for (const name of ["Follow Up", "Follow-Up", "follow up team", "FOLLOWUP"]) {
      expect(isFollowUpUnit(name)).toBe(true);
    }
    expect(isFollowUpUnit("Integration Team")).toBe(false);
  });

  it("recognises the Integration Team the same way", () => {
    for (const name of ["Integration", "Integration Team", "integration/assimilation"]) {
      expect(isIntegrationUnit(name)).toBe(true);
    }
    expect(isIntegrationUnit("Follow Up")).toBe(false);
  });

  it("says no to a unit that has not loaded yet", () => {
    expect(isFollowUpUnit(undefined)).toBe(false);
    expect(isIntegrationUnit(null)).toBe(false);
  });
});
