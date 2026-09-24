import { describe, expect, it } from "vitest";
import { confessionCaption, scriptureAndConfessionCaption } from "./scripture-share";

describe("confessionCaption", () => {
  it("copies the confession one line per breath, with the sermon it came from", () => {
    const text = confessionCaption({
      date: "2026-09-24",
      lines: ["I am of the Everlasting Hills.", "I am endued with power.", "Nothing can stop me — in Jesus’ name!"],
      sermon: { word: "Power", verseReference: "Matthew 10:1", source: "From Wednesday’s sermon" },
    });
    expect(text).toBe(
      [
        "The Hills Confession",
        "",
        "I am of the Everlasting Hills.",
        "I am endued with power.",
        "Nothing can stop me — in Jesus’ name!",
        "",
        "Word of the Day: Power (Matthew 10:1)",
        "From Wednesday’s sermon",
        "",
        "Everlasting Hills Church",
        "Worship with us: https://everlastinghills.church",
      ].join("\n"),
    );
  });

  it("leaves out the sermon lines for the fixed confession", () => {
    const text = confessionCaption({ date: "2026-09-24", lines: ["I am of the Everlasting Hills."] });
    expect(text).not.toContain("Word of the Day");
    expect(text).toContain("everlastinghills.church");
  });
});

describe("scriptureAndConfessionCaption", () => {
  it("puts the verse first, then the confession, and names the church once", () => {
    const text = scriptureAndConfessionCaption(
      {
        date: "2026-09-24",
        timezone: "Africa/Lagos",
        reference: "Psalm 121:1",
        text: "I will lift up mine eyes unto the hills.",
        translationCode: "KJV",
        translationName: "King James Version",
      },
      { date: "2026-09-24", lines: ["I am of the Everlasting Hills."] },
    );
    expect(text.startsWith("I will lift up mine eyes unto the hills.\nPsalm 121:1 (KJV)\n\nThe Hills Confession")).toBe(true);
    expect(text.match(/everlastinghills\.church/g)).toHaveLength(1);
  });
});
