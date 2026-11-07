import type { JSONContent } from "@tiptap/core";
import { inlineMarkdown } from "./inline-markdown";

/** Every paragraph or heading inside a node, at any depth (for lists and quotes). */
function textBlocks(node: JSONContent): JSONContent[] {
  if (node.type === "paragraph" || node.type === "heading") return [node];
  return (node.content ?? []).flatMap(textBlocks);
}

function listMarkdown(node: JSONContent): string {
  const ordered = node.type === "orderedList";
  // The reader has no nested lists, so nested items join the list they sit in.
  return textBlocks(node)
    .map((block) => inlineMarkdown(block.content, " "))
    .filter(Boolean)
    .map((line, i) => `${ordered ? `${Math.min(i + 1, 99)}.` : "-"} ${line}`)
    .join("\n");
}

function blockMarkdown(node: JSONContent): string {
  switch (node.type) {
    case "paragraph":
      return inlineMarkdown(node.content);
    case "heading": {
      // "####" because the reader shows #–### as its larger heading.
      const text = inlineMarkdown(node.content, " ");
      return text ? `${node.attrs?.level === 3 ? "####" : "##"} ${text}` : "";
    }
    case "bulletList":
    case "orderedList":
      return listMarkdown(node);
    case "blockquote":
      return textBlocks(node)
        .map((block) => inlineMarkdown(block.content, "\n> "))
        .filter(Boolean)
        .map((line) => `> ${line}`)
        .join("\n");
    case "horizontalRule":
      return "---";
    default:
      return textBlocks(node)
        .map((block) => inlineMarkdown(block.content))
        .filter(Boolean)
        .join("\n\n");
  }
}

/** An editor document as the Markdown subset the reader renders. */
export function docToMarkdown(doc: JSONContent): string {
  return (doc.content ?? []).map(blockMarkdown).filter(Boolean).join("\n\n");
}
