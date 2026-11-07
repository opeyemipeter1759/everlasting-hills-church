import type { JSONContent } from "@tiptap/core";
import { SAFE_HREF } from "./safe-href";

/** One run of text with its formatting, flattened from the editor's marks. */
export interface Segment {
  text: string;
  isBreak?: boolean;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  href?: string;
}

/** Unsafe link targets are dropped here, so they never reach the Markdown. */
export function toSegments(nodes: JSONContent[] | undefined): Segment[] {
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
