import { describe, expect, it } from "vitest";
import { cmsSaveError, tidyContent } from "./cms-tidy";

describe("tidyContent", () => {
  it("drops blank lines from lists at any depth and keeps everything else", () => {
    const before = {
      setman: { paragraphs: ["Welcome.", "", "  ", "We are glad you came.", ""], name: "Pastor", photo: null, visible: true },
      games: [{ name: "Tug of war", forWho: "" }],
    };
    expect(tidyContent(before)).toEqual({
      setman: { paragraphs: ["Welcome.", "We are glad you came."], name: "Pastor", photo: null, visible: true },
      games: [{ name: "Tug of war", forWho: "" }],
    });
  });
});

describe("cmsSaveError", () => {
  it("names the fields the server refused", () => {
    const msg = cmsSaveError({ message: "Invalid page content", details: [{ path: "setman.paragraphs.5", message: "Too big" }] });
    expect(msg).toBe("Not saved. Fix setman › paragraphs › item 6: Too big.");
  });
  it("falls back to the message", () => {
    expect(cmsSaveError({ message: "Network down" })).toBe("Not saved: Network down");
  });
});
