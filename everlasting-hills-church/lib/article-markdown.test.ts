import { describe, expect, it } from "vitest";
import type { JSONContent } from "@tiptap/core";
import { docToMarkdown, markdownToDoc } from "./article-markdown";
import { parseBlocks } from "./rich-text";

const text = (t: string, ...marks: JSONContent["marks"][]) =>
  marks.length && marks[0] ? { type: "text", text: t, marks: marks[0] } : { type: "text", text: t };
const doc = (...content: JSONContent[]): JSONContent => ({ type: "doc", content });
const p = (...content: JSONContent[]): JSONContent => ({ type: "paragraph", content });

describe("article markdown", () => {
  it("round-trips every block the reader supports", () => {
    const md = [
      "## A heading",
      "#### A subheading",
      "Plain with **bold**, *italic*, `code` and a [link](https://example.org).",
      "Line one\nLine two",
      "- one\n- two",
      "1. first\n2. second",
      "> a quote",
      "---",
    ].join("\n\n");
    expect(docToMarkdown(markdownToDoc(md))).toBe(md);
  });

  it("writes markers in an order the reader parses back", () => {
    const tricky = doc(
      p(
        text("bold ", [{ type: "bold" }]),
        text("and italic", [{ type: "bold" }, { type: "italic" }]),
      ),
      p(text("see ", [{ type: "italic" }]), text("this", [{ type: "italic" }, { type: "link", attrs: { href: "https://x.org" } }])),
      p(text("a ", [{ type: "bold" }]), text("link", [{ type: "bold" }, { type: "link", attrs: { href: "/x" } }])),
    );
    const md = docToMarkdown(tricky);
    // Whatever we write, reading it back must give the same document.
    expect(docToMarkdown(markdownToDoc(md))).toBe(md);
    const [first] = parseBlocks(md);
    expect(first).toMatchObject({ kind: "paragraph", children: [{ kind: "bold" }] });
    expect(JSON.stringify(parseBlocks(md))).not.toMatch(/"text":"[^"]*[*_[\]]/);
  });

  it("keeps spaces outside the markers", () => {
    expect(docToMarkdown(doc(p(text("Hello "), text("world ", [{ type: "bold" }]), text("again"))))).toBe(
      "Hello **world** again",
    );
  });

  it("flattens nested lists and drops unsafe links", () => {
    const nested = doc({
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [p(text("outer")), { type: "bulletList", content: [{ type: "listItem", content: [p(text("inner"))] }] }],
        },
      ],
    });
    expect(docToMarkdown(nested)).toBe("- outer\n- inner");
    expect(docToMarkdown(doc(p(text("click", [{ type: "link", attrs: { href: "javascript:alert(1)" } }]))))).toBe("click");
  });

  it("leaves pasted addresses bare", () => {
    const url = "https://youtube.com/live/abc";
    expect(docToMarkdown(doc(p(text("Watch "), text(url, [{ type: "link", attrs: { href: url } }]))))).toBe(`Watch ${url}`);
  });

  it("gives an empty story an empty paragraph to type in", () => {
    expect(markdownToDoc("")).toEqual({ type: "doc", content: [{ type: "paragraph" }] });
    expect(docToMarkdown(markdownToDoc(""))).toBe("");
  });
});
