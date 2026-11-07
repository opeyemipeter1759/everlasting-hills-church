import type { JSONContent } from "@tiptap/core";
import { parseBlocks, type Inline } from "@/lib/rich-text";

/**
 * Converts between an article body (the Markdown subset in lib/rich-text.ts,
 * which is what every reader renders) and the visual editor's document.
 *
 * Reading goes through parseBlocks, the same parser the reader uses, so the
 * editor shows exactly what the published page will. Writing emits only
 * syntax that parser understands, with the markers ordered so it reads them
 * back the same way: bold outermost, then links, then italics, and inline
 * code on its own (the parser matches code before everything else, so code
 * can never sit inside another marker).
 *
 * Two levels of heading: "##" and "####", because the reader collapses
 * #–### to its larger heading and anything deeper to the smaller one.
 */

/** Same rule as the reader: only these become clickable. */
export const SAFE_HREF = /^(?:https?:\/\/|mailto:|\/)/i;
const WHOLE_BARE_URL = /^https?:\/\/[^\s<>()]+[^\s<>().,;:!?"\x27]$/i;

type Mark = { type: string; attrs?: Record<string, unknown> };

// ── Markdown → editor ────────────────────────────────────────────────────────

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

// ── Editor → Markdown ────────────────────────────────────────────────────────

interface Segment {
  text: string;
  isBreak?: boolean;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  href?: string;
}

function toSegments(nodes: JSONContent[] | undefined): Segment[] {
  const segments: Segment[] = [];
  for (const node of nodes ?? []) {
    if (node.type === "hardBreak") {
      segments.push({ text: "", isBreak: true });
      continue;
    }
    if (node.type !== "text" || !node.text) continue;
    const marks = node.marks ?? [];
    const has = (type: string) => marks.some((m) => m.type === type);
    const rawHref = marks.find((m) => m.type === "link")?.attrs?.href;
    const href = typeof rawHref === "string" && SAFE_HREF.test(rawHref.trim()) ? rawHref.trim() : undefined;
    const code = has("code");
    segments.push({
      text: code ? node.text.replace(/`/g, "'").replace(/\n/g, " ") : node.text,
      code,
      bold: !code && has("bold"),
      italic: !code && has("italic"),
      href: code ? undefined : href,
    });
  }
  return segments;
}

const ORDER = ["bold", "href", "italic"] as const;
type Key = (typeof ORDER)[number];

function keyOf(segment: Segment, key: Key): string | null {
  if (segment.isBreak) return null;
  if (key === "href") return segment.href ?? null;
  return segment[key] ? "on" : null;
}

/** Markers may not open or close against whitespace, so keep it outside them. */
function wrap(inner: string, open: string, close: string): string {
  const match = inner.match(/^(\s*)([\s\S]*?)(\s*)$/)!;
  return match[2] ? `${match[1]}${open}${match[2]}${close}${match[3]}` : inner;
}

function plainText(segments: Segment[]): string {
  return segments.map((s) => s.text).join("");
}

function render(segments: Segment[], depth: number, inBold: boolean, lineBreak: string): string {
  if (depth === ORDER.length) {
    return segments
      .map((s) => (s.isBreak ? lineBreak : s.code ? wrap(s.text, "`", "`") : s.text))
      .join("");
  }

  const key = ORDER[depth];
  let out = "";
  let i = 0;
  while (i < segments.length) {
    const groupKey = keyOf(segments[i], key);
    let j = i + 1;
    while (j < segments.length && keyOf(segments[j], key) === groupKey) j += 1;
    const group = segments.slice(i, j);
    i = j;

    if (!groupKey) {
      out += render(group, depth + 1, inBold, lineBreak);
      continue;
    }

    if (key === "bold") {
      out += wrap(render(group, depth + 1, true, lineBreak), "**", "**");
    } else if (key === "href") {
      const inner = render(group, depth + 1, inBold, lineBreak);
      const text = plainText(group);
      if (text === groupKey && WHOLE_BARE_URL.test(groupKey) && inner === text) {
        out += text; // A pasted address reads better bare, and the reader links it.
      } else {
        const label = inner.replace(/[[\]]/g, "");
        const href = groupKey.replace(/\s/g, "%20").replace(/\)/g, "%29");
        out += label.trim() ? wrap(label, "[", `](${href})`) : label;
      }
    } else {
      // Inside bold, "*" would collide with the "**" around it; "_" does not,
      // but only works when it does not follow a letter.
      const delimiter = inBold && !/\w$/.test(out) ? "_" : "*";
      out += wrap(render(group, depth + 1, inBold, lineBreak), delimiter, delimiter);
    }
  }
  return out;
}

function inlineMarkdown(nodes: JSONContent[] | undefined, lineBreak = "\n"): string {
  return render(toSegments(nodes), 0, false, lineBreak).trim();
}

/** Lines of every paragraph inside a node, at any depth (for lists and quotes). */
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

export function docToMarkdown(doc: JSONContent): string {
  return (doc.content ?? []).map(blockMarkdown).filter(Boolean).join("\n\n");
}
