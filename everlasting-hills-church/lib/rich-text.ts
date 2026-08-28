/**
 * A deliberately small Markdown subset, shared by every surface that renders
 * admin-authored copy (announcements today, and anything else composed in a
 * plain textarea later).
 *
 * Why not react-markdown: the bodies here are written in a textarea — often
 * pasted out of the AI composer — so they only ever contain bold, italics, the
 * occasional heading, bullets and links. A full CommonMark pipeline
 * (react-markdown + remark + rehype-sanitize) is tens of KB gzipped on a member
 * dashboard opened over Nigerian mobile data, to parse syntax we never emit.
 * This parser produces React nodes rather than HTML, so there is no
 * dangerouslySetInnerHTML in the render path and no XSS surface even though
 * announcement bodies are user input.
 *
 * Anything it does not recognise is passed through as literal text, which is
 * the correct failure mode: an unsupported marker shows as typed instead of
 * swallowing the sentence around it.
 *
 * No lookbehind assertions anywhere in this file. Safari only shipped them in
 * 16.4, and a lookbehind in a module-scope regex literal is a parse error, not
 * a runtime one — it would blank the whole page on an older iPhone rather than
 * degrade the formatting. Where a "not preceded by X" rule is needed, the
 * preceding character is captured and re-emitted instead.
 */

export type Inline =
  | { kind: "text"; text: string }
  | { kind: "bold"; children: Inline[] }
  | { kind: "italic"; children: Inline[] }
  | { kind: "code"; text: string }
  | { kind: "link"; href: string; children: Inline[] };

export type Block =
  | { kind: "heading"; level: 3 | 4; children: Inline[] }
  | { kind: "paragraph"; children: Inline[] }
  | { kind: "list"; ordered: boolean; items: Inline[][] }
  | { kind: "quote"; children: Inline[] }
  | { kind: "rule" };

/** Only these schemes, plus same-origin paths, become clickable. */
const SAFE_HREF = /^(?:https?:\/\/|mailto:|\/)/i;

/**
 * Bare URLs, so a pasted link is clickable without the author knowing Markdown.
 * Trailing punctuation is excluded because "…see https://x.org/live." must not
 * swallow the full stop into the href. \x27 is an apostrophe.
 */
const BARE_URL = /https?:\/\/[^\s<>()]+[^\s<>().,;:!?"\x27]/i;

const LIST_ITEM = /^\s*(?:[-*•]|\d{1,2}[.)])\s+/;
const ORDERED_ITEM = /^\s*\d{1,2}[.)]\s+/;

function textNode(text: string): Inline {
  return { kind: "text", text };
}

/**
 * Splits a run of text on bare URLs. Runs last, on the leftovers of the marker
 * passes, so a URL already inside [label](href) is not linked twice.
 */
function linkifyBareUrls(text: string): Inline[] {
  const out: Inline[] = [];
  // Built per call: a /g regex carries lastIndex between calls, and this is
  // reached from a recursive parse.
  const re = new RegExp(BARE_URL.source, "gi");
  let cursor = 0;
  let match = re.exec(text);

  while (match) {
    if (match.index > cursor) out.push(textNode(text.slice(cursor, match.index)));
    out.push({ kind: "link", href: match[0], children: [textNode(match[0])] });
    cursor = match.index + match[0].length;
    match = re.exec(text);
  }

  if (cursor < text.length) out.push(textNode(text.slice(cursor)));
  return out;
}

interface InlineRule {
  re: RegExp;
  /**
   * True when the regex captures the character before the marker in group 1 to
   * stand in for a lookbehind. That character is left in the text stream.
   */
  keepsPrefix?: boolean;
  build: (m: RegExpMatchArray) => Inline;
}

/**
 * Inline markers, applied outermost-first: each pass splits on one marker and
 * recurses into the captured content, so `**bold with a [link](url)**` works.
 *
 * Order matters. `**` is matched before `*`, and `__` before `_`, otherwise the
 * single-character italic rule would eat the first half of a bold marker.
 *
 * The italic rules require a non-space immediately inside both markers, so
 * "5 * 3" and a trailing asterisk stay literal. The underscore rules
 * additionally require a non-word character before the opening marker so that
 * snake_case identifiers are not mangled.
 */
const INLINE_RULES: InlineRule[] = [
  { re: /`([^`\n]+)`/, build: (m) => ({ kind: "code", text: m[1] }) },
  { re: /\*\*(\S[^\n]*?)\*\*/, build: (m) => ({ kind: "bold", children: parseInline(m[1]) }) },
  {
    re: /(^|[^A-Za-z0-9_])__(\S[^\n]*?)__/,
    keepsPrefix: true,
    build: (m) => ({ kind: "bold", children: parseInline(m[2]) }),
  },
  {
    re: /\[([^\]\n]+)\]\(([^)\s]+)\)/,
    build: (m) => ({
      kind: "link",
      href: SAFE_HREF.test(m[2]) ? m[2] : "",
      children: parseInline(m[1]),
    }),
  },
  { re: /\*(\S|\S[^*\n]*\S)\*/, build: (m) => ({ kind: "italic", children: parseInline(m[1]) }) },
  {
    re: /(^|[^A-Za-z0-9_])_(\S|\S[^_\n]*\S)_/,
    keepsPrefix: true,
    build: (m) => ({ kind: "italic", children: parseInline(m[2]) }),
  },
];

export function parseInline(input: string): Inline[] {
  for (const rule of INLINE_RULES) {
    const match = input.match(rule.re);
    if (!match || match.index === undefined) continue;

    const prefix = rule.keepsPrefix ? match[1].length : 0;
    const node = rule.build(match);
    // A link whose scheme we refused: keep the author's text, drop the markup.
    const resolved: Inline[] = node.kind === "link" && !node.href ? node.children : [node];

    return [
      ...parseInline(input.slice(0, match.index + prefix)),
      ...resolved,
      ...parseInline(input.slice(match.index + match[0].length)),
    ];
  }

  return input ? linkifyBareUrls(input) : [];
}

/**
 * Groups lines into blocks. Blank lines separate paragraphs; a single newline
 * inside a paragraph is kept as a soft break, because announcement authors use
 * one-line-per-detail formatting ("Date: …", "Time: …", "Venue: …") and
 * collapsing those into a wall of prose is exactly the bug this fixes.
 */
export function parseBlocks(input: string): Block[] {
  const blocks: Block[] = [];
  const lines = (input ?? "").replace(/\r\n?/g, "\n").split("\n");
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push({ kind: "paragraph", children: parseInline(paragraph.join("\n")) });
    paragraph = [];
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      continue;
    }

    if (/^(?:-{3,}|_{3,}|\*{3,})$/.test(trimmed)) {
      flushParagraph();
      blocks.push({ kind: "rule" });
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      // Collapsed to two visual levels: these bodies sit inside cards that
      // already have a title, so honouring h1–h6 would produce headings larger
      // than the card heading above them.
      blocks.push({
        kind: "heading",
        level: heading[1].length <= 3 ? 3 : 4,
        children: parseInline(heading[2].replace(/\s*#+\s*$/, "")),
      });
      continue;
    }

    if (trimmed.charAt(0) === ">") {
      flushParagraph();
      blocks.push({ kind: "quote", children: parseInline(trimmed.replace(/^>\s?/, "")) });
      continue;
    }

    if (LIST_ITEM.test(line)) {
      flushParagraph();
      const ordered = ORDERED_ITEM.test(line);
      const items: Inline[][] = [];
      let j = i;
      // Consume the whole run so consecutive bullets render as one list.
      while (
        j < lines.length &&
        LIST_ITEM.test(lines[j]) &&
        ORDERED_ITEM.test(lines[j]) === ordered
      ) {
        items.push(parseInline(lines[j].replace(LIST_ITEM, "")));
        j += 1;
      }
      blocks.push({ kind: "list", ordered, items });
      i = j - 1;
      continue;
    }

    paragraph.push(trimmed);
  }

  flushParagraph();
  return blocks;
}

/**
 * Markdown removed, whitespace collapsed. For anywhere the formatted version
 * cannot go: clamped card previews (CSS line-clamp needs a single text run),
 * push notification bodies, and meta descriptions.
 */
export function stripMarkdown(input: string): string {
  return (input ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s*(?:[-*•]|\d{1,2}[.)])\s+/gm, "")
    .replace(/^\s*(?:-{3,}|_{3,}|\*{3,})\s*$/gm, " ")
    .replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, "$1")
    .replace(/\*\*(\S[^\n]*?)\*\*/g, "$1")
    .replace(/(^|[^A-Za-z0-9_])__(\S[^\n]*?)__/g, "$1$2")
    .replace(/\*(\S|\S[^*\n]*\S)\*/g, "$1")
    .replace(/(^|[^A-Za-z0-9_])_(\S|\S[^_\n]*\S)_/g, "$1$2")
    .replace(/\s+/g, " ")
    .trim();
}
