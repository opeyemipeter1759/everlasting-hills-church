import { describe, expect, it } from "vitest";
import { isAudioProductionUnitName } from "./audio-production";

describe("isAudioProductionUnitName", () => {
  it.each([
    "Audio Production",
    "audio production",
    "AUDIO PRODUCTION ",
    " Audio  Production",
    "Audio-Production",
    "Audio Production Unit",
    "Audio Production Team",
    "Audio Post Production Unit",
    "Audio post Prodution unit",
    "AUDIO POST-PRODUCTION",
  ])("recognises %j", (name) => {
    expect(isAudioProductionUnitName(name)).toBe(true);
  });

  it.each(["Audio", "Production", "Media", "Visual Production", "Production Audio", "", null, undefined, 42])(
    "rejects %j",
    (name) => {
      expect(isAudioProductionUnitName(name)).toBe(false);
    },
  );
});
