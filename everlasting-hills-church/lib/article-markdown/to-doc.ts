import type { JSONContent } from "@tiptap/core";
import { parseBlocks, type Inline } from "@/lib/rich-text";

type Mark = { type: string; attrs?: Record<string, unknown> };

function inlineToNodes(nodes: Inline[], marks: Mark[] = []): JSONContent[] {
  const out: JSONContent[] = [];
  const withMarks = (node: JSONContent, m: Mark[]) => (m.length ? { ...node, marks: m } : node);

  for (const node of nodes) {
    switch (node.kind) {
      case "text":
        node.text.split("\n").forEach((part, i) => {
          if (i > 0) out.push({ type: "hardBreak" });
          if (part) out.push(withMarks({ type: "text", text: part }, marks));
        });
        break;
      case "code":
        // The code mark excludes every other mark in the editor schema.
        if (node.text) out.push({ type: "text", text: node.text, marks: [{ type: "code" }] });
        break;
      case "bold":
        out.push(...inlineToNodes(node.children, [...marks, { type: "bold" }]));
        break;
      case "italic":
        out.push(...inlineToNodes(node.children, [...marks, { type: "italic" }]));
        break;
      case "link":
        out.push(...inlineToNodes(node.children, [...marks, { type: "link", attrs: { href: node.href } }]));
        break;
    }
  }
  return out;
}

function paragraph(content: JSONContent[]): JSONContent {
  return content.length ? { type: "paragraph", content } : { type: "paragraph" };
}

/**
 * Markdown to an editor document. Headings: the reader's larger level
 * (#–###) becomes h2, its smaller one (####+) h3.
 */
export function markdownToDoc(markdown: string): JSONContent {
  const content: JSONContent[] = [];

  for (const block of parseBlocks(markdown ?? "")) {
    switch (block.kind) {
      case "heading": {
        const inline = inlineToNodes(block.children);
        content.push(
          inline.length
            ? { type: "heading", attrs: { level: block.level === 3 ? 2 : 3 }, content: inline }
            : paragraph([]),
        );
        break;
      }
      case "paragraph":
        content.push(paragraph(inlineToNodes(block.children)));
        break;
      case "list":
        content.push({
          type: block.ordered ? "orderedList" : "bulletList",
          content: block.items.map((item) => ({ type: "listItem", content: [paragraph(inlineToNodes(item))] })),
        });
        break;
      case "quote": {
        // The reader treats each "> line" as its own quote; in the editor,
        // consecutive ones are one quote with several paragraphs.
        const last = content[content.length - 1];
        const line = paragraph(inlineToNodes(block.children));
        if (last?.type === "blockquote") last.content!.push(line);
        else content.push({ type: "blockquote", content: [line] });
        break;
      }
      case "rule":
        content.push({ type: "horizontalRule" });
        break;
    }
  }

  return { type: "doc", content: content.length ? content : [paragraph([])] };
}
