import type { ReactNode } from "react";

/**
 * Renders a message the way it was typed: *bold*, _italic_, ~strike~, `code`,
 * links, and @mentions picked out — the small mark-up Slack uses, rather than
 * a rich-text editor storing HTML we would then have to trust.
 *
 * Everything is built as React elements from plain text, so nothing a person
 * writes can inject markup into the page.
 */

// Accented letters are spelled out rather than using \p{L}, which needs a
// newer compile target than this project builds with.
const LETTER = "A-Za-z\\u00C0-\\u024F";
const MENTION = `@[${LETTER}][${LETTER}'-]*(?: [${LETTER}][${LETTER}'-]*)?`;
const PATTERN = new RegExp(
  `(\\*[^*\\n]+\\*)|(_[^_\\n]+_)|(~[^~\\n]+~)|(\`[^\`\\n]+\`)|(https?://[^\\s<]+)|(${MENTION})`,
  "g",
);

const MENTION_CLASS =
  "rounded bg-[#87102C]/10 px-1 font-medium text-[#87102C] dark:bg-[#FFB3C1]/15 dark:text-[#FFB3C1]";

function inline(token: string, key: number): ReactNode {
  if (token.startsWith("*") && token.endsWith("*")) {
    return <strong key={key} className="font-bold">{token.slice(1, -1)}</strong>;
  }
  if (token.startsWith("_") && token.endsWith("_")) {
    return <em key={key}>{token.slice(1, -1)}</em>;
  }
  if (token.startsWith("~") && token.endsWith("~")) {
    return <s key={key} className="opacity-70">{token.slice(1, -1)}</s>;
  }
  if (token.startsWith("`") && token.endsWith("`")) {
    return (
      <code key={key} className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[13px] text-[#87102C] dark:bg-white/10 dark:text-[#FFB3C1]">
        {token.slice(1, -1)}
      </code>
    );
  }
  if (token.startsWith("http")) {
    return (
      <a key={key} href={token} target="_blank" rel="noreferrer" className="text-sky-600 hover:underline dark:text-sky-400">
        {token}
      </a>
    );
  }
  return <span key={key} className={MENTION_CLASS}>{token}</span>;
}

/** One line, with quotes and list bullets handled before the inline marks. */
function line(text: string, key: number): ReactNode {
  if (text.startsWith("> ")) {
    return (
      <span key={key} className="my-0.5 block border-l-2 border-gray-300 pl-2.5 text-gray-600 dark:border-white/20 dark:text-white/60">
        {formatInline(text.slice(2))}
      </span>
    );
  }
  const bullet = /^([-*]|\d+\.)\s+/.exec(text);
  if (bullet) {
    return (
      <span key={key} className="flex gap-2">
        <span className="select-none text-gray-400 dark:text-white/35">{bullet[1] === "-" || bullet[1] === "*" ? "•" : bullet[1]}</span>
        <span>{formatInline(text.slice(bullet[0].length))}</span>
      </span>
    );
  }
  return <span key={key} className="block">{formatInline(text) as ReactNode}</span>;
}

function formatInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let last = 0;
  let key = 0;
  PATTERN.lastIndex = 0;
  let match = PATTERN.exec(text);
  while (match) {
    const at = match.index;
    if (at > last) parts.push(text.slice(last, at));
    parts.push(inline(match[0], key++));
    last = at + match[0].length;
    match = PATTERN.exec(text);
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function MessageBody({ body }: { body: string }) {
  return <>{body.split("\n").map((text, i) => line(text, i))}</>;
}
