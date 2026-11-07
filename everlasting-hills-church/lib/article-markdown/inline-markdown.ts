import type { JSONContent } from "@tiptap/core";
import { WHOLE_BARE_URL } from "./safe-href";
import { toSegments, type Segment } from "./segments";

/**
 * Marker order, outermost first: bold, then links, then italics. That is the
 * order the reader's parser can read back (it matches bold before links and
 * links before italics). Inline code sits alone, as the parser takes it first.
 */
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

function leaves(segments: Segment[], lineBreak: string): string {
  return segments.map((s) => (s.isBreak ? lineBreak : s.code ? wrap(s.text, "`", "`") : s.text)).join("");
}

function link(group: Segment[], href: string, inner: string): string {
  const text = group.map((s) => s.text).join("");
  // A pasted address reads better bare, and the reader links it anyway.
  if (text === href && WHOLE_BARE_URL.test(href) && inner === text) return text;
  const label = inner.replace(/[[\]]/g, "");
  const safe = href.replace(/\s/g, "%20").replace(/\)/g, "%29");
  return label.trim() ? wrap(label, "[", `](${safe})`) : label;
}

function render(segments: Segment[], depth: number, inBold: boolean, lineBreak: string): string {
  if (depth === ORDER.length) return leaves(segments, lineBreak);

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
    } else if (key === "bold") {
      out += wrap(render(group, depth + 1, true, lineBreak), "**", "**");
    } else if (key === "href") {
      out += link(group, groupKey, render(group, depth + 1, inBold, lineBreak));
    } else {
      // Inside bold, "*" would collide with the "**" around it; "_" does not,
      // but only works when it does not follow a letter.
      const delimiter = inBold && !/\w$/.test(out) ? "_" : "*";
      out += wrap(render(group, depth + 1, inBold, lineBreak), delimiter, delimiter);
    }
  }
  return out;
}

/** A paragraph's (or heading's, or list item's) content as Markdown. */
export function inlineMarkdown(nodes: JSONContent[] | undefined, lineBreak = "\n"): string {
  return render(toSegments(nodes), 0, false, lineBreak).trim();
}
