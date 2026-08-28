import { describe, expect, it } from "vitest";
import { parseBlocks, parseInline, stripMarkdown, type Inline } from "./rich-text";

/** Flattens parsed inline nodes to "kind:text" pairs for compact assertions. */
function flatten(nodes: Inline[]): string[] {
  return nodes.flatMap((node) => {
    if (node.kind === "text") return [`text:${node.text}`];
    if (node.kind === "code") return [`code:${node.text}`];
    if (node.kind === "link") return [`link:${node.href}`, ...flatten(node.children)];
    return [`${node.kind}:`, ...flatten(node.children)];
  });
}

describe("parseInline", () => {
  it("marks bold and italics", () => {
    expect(flatten(parseInline("**Date:** 25-08-2026"))).toEqual([
      "bold:",
      "text:Date:",
      "text: 25-08-2026",
    ]);
    expect(flatten(parseInline("this is *urgent*"))).toEqual(["text:this is ", "italic:", "text:urgent"]);
  });

  it("nests markers", () => {
    expect(flatten(parseInline("**join us at [the link](https://ehc.org/live)**"))).toEqual([
      "bold:",
      "text:join us at ",
      "link:https://ehc.org/live",
      "text:the link",
    ]);
  });

  it("links bare URLs without swallowing trailing punctuation", () => {
    expect(flatten(parseInline("Watch at https://youtube.com/live/abc?si=xY_1."))).toEqual([
      "text:Watch at ",
      "link:https://youtube.com/live/abc?si=xY_1",
      "text:https://youtube.com/live/abc?si=xY_1",
      "text:.",
    ]);
  });

  it("refuses unsafe link schemes but keeps the label", () => {
    expect(flatten(parseInline("[tap here](javascript:alert)"))).toEqual(["text:tap here"]);
  });

  it("leaves stray and non-marker punctuation alone", () => {
    expect(flatten(parseInline("Give 5 * 3 times"))).toEqual(["text:Give 5 * 3 times"]);
    expect(flatten(parseInline("column user_id_here stays"))).toEqual(["text:column user_id_here stays"]);
  });
});

describe("parseBlocks", () => {
  it("keeps single newlines inside a paragraph", () => {
    const blocks = parseBlocks("Date: 25-08-2026\nTime: 8:00 PM");
    expect(blocks).toHaveLength(1);
    expect(blocks[0].kind).toBe("paragraph");
  });

  it("splits paragraphs on blank lines", () => {
    expect(parseBlocks("First para.\n\nSecond para.").map((b) => b.kind)).toEqual([
      "paragraph",
      "paragraph",
    ]);
  });

  it("groups a bullet run into one list", () => {
    const blocks = parseBlocks("Bring:\n- Bible\n- Notebook\n- A friend");
    expect(blocks.map((b) => b.kind)).toEqual(["paragraph", "list"]);
    const list = blocks[1];
    if (list.kind !== "list") throw new Error("expected a list");
    expect(list.ordered).toBe(false);
    expect(list.items).toHaveLength(3);
  });

  it("collapses heading levels to the two the cards can show", () => {
    const blocks = parseBlocks("# Big\n\n#### Small");
    expect(blocks.map((b) => (b.kind === "heading" ? b.level : b.kind))).toEqual([3, 4]);
  });
});

describe("stripMarkdown", () => {
  it("removes markers and collapses whitespace", () => {
    expect(stripMarkdown("### **AT HIS FEET**\n\nWorship.\nPrayer.")).toBe("AT HIS FEET Worship. Prayer.");
  });

  it("keeps link text and drops the target", () => {
    expect(stripMarkdown("Join [here](https://ehc.org/live) tonight")).toBe("Join here tonight");
  });

  it("leaves snake_case intact", () => {
    expect(stripMarkdown("field user_id_value")).toBe("field user_id_value");
  });
});
