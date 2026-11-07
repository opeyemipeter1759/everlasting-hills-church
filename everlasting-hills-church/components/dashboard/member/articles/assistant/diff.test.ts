import { describe, expect, it } from "vitest";
import { diffWords } from "./diff";

describe("diffWords", () => {
  it("groups neighbouring edits into one phrase", () => {
    expect(diffWords("i has a story", "I have a story")).toEqual([
      { kind: "del", text: "i has" },
      { kind: "add", text: "I have" },
      { kind: "same", text: " a story" },
    ]);
  });

  it("keeps untouched text whole", () => {
    expect(diffWords("Grace is enough.", "Grace is enough.")).toEqual([{ kind: "same", text: "Grace is enough." }]);
  });

  it("gives up on very long texts rather than freezing the page", () => {
    const long = "word ".repeat(3_000);
    expect(diffWords(long, `${long}more`)).toBeNull();
  });
});
