/**
 * The same small Markdown subset the frontend renders (see
 * everlasting-hills-church/lib/rich-text.ts), for the two places the backend
 * emits announcement copy: push notification bodies and HTML email.
 *
 * Announcement bodies are composed in a textarea and frequently pasted out of
 * the AI composer, so they arrive with **bold**, ### headings and bullets in
 * them. Sending those markers verbatim shows a member `**Date:** 25-08-2026` on
 * their lock screen.
 *
 * Deliberately duplicated rather than shared through a package: the two
 * codebases build separately, and this is ~40 lines of regex whose only
 * coupling is the syntax an admin can type.
 */

/** Markdown removed, whitespace collapsed. For push bodies and plain-text mail. */
export function stripMarkdown(input: string): string {
  return (input ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s*(?:[-*•]|\d{1,2}[.)])\s+/gm, '')
    .replace(/^\s*(?:-{3,}|_{3,}|\*{3,})\s*$/gm, ' ')
    .replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, '$1')
    .replace(/\*\*(\S[^\n]*?)\*\*/g, '$1')
    .replace(/(^|[^A-Za-z0-9_])__(\S[^\n]*?)__/g, '$1$2')
    .replace(/\*(\S|\S[^*\n]*\S)\*/g, '$1')
    .replace(/(^|[^A-Za-z0-9_])_(\S|\S[^_\n]*\S)_/g, '$1$2')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Inline Markdown to HTML. The caller MUST pass HTML-escaped text: this only
 * adds tags, it never escapes, so running it on raw input would let an
 * announcement body inject markup into every member's inbox.
 *
 * Only http(s) and mailto links are emitted. Email clients are an unusually
 * hostile place for a javascript: URL to end up.
 */
export function inlineMarkdownToHtml(escaped: string): string {
  return escaped
    .replace(/`([^`\n]+)`/g, '<code style="font-family:monospace">$1</code>')
    .replace(
      /\[([^\]\n]+)\]\(((?:https?:\/\/|mailto:)[^)\s]+)\)/g,
      '<a href="$2" style="color:#87102C">$1</a>',
    )
    .replace(/\*\*(\S[^\n]*?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^A-Za-z0-9_])__(\S[^\n]*?)__/g, '$1<strong>$2</strong>')
    .replace(/\*(\S|\S[^*\n]*\S)\*/g, '<em>$1</em>')
    .replace(/(^|[^A-Za-z0-9_])_(\S|\S[^_\n]*\S)_/g, '$1<em>$2</em>')
    // Bare URLs last, so a URL already inside an href is not re-linked. The
    // negative lookahead for a quote is what keeps it out of the tags above.
    .replace(
      /(^|[\s(])(https?:\/\/[^\s<>()"]+[^\s<>().,;:!?"])/g,
      '$1<a href="$2" style="color:#87102C">$2</a>',
    );
}

/**
 * A full announcement body to email-safe HTML: blank lines become paragraphs,
 * single newlines become <br/> (authors write "Date: … / Time: … / Venue: …"
 * one per line), `### headings` and bullet runs keep their shape.
 *
 * Takes RAW text and escapes it here, so callers cannot forget to.
 */
export function markdownToEmailHtml(
  input: string,
  escapeHtml: (value: string) => string,
): string {
  const paragraphStyle = 'margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7';

  return (input ?? '')
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((chunk) => {
      const lines = chunk.split('\n').filter((line) => line.trim().length > 0);
      if (!lines.length) return '';

      const isList = lines.every((line) => /^\s*(?:[-*•]|\d{1,2}[.)])\s+/.test(line));
      if (isList) {
        const ordered = /^\s*\d{1,2}[.)]\s+/.test(lines[0]);
        const items = lines
          .map(
            (line) =>
              `<li style="margin:0 0 6px">${inlineMarkdownToHtml(
                escapeHtml(line.replace(/^\s*(?:[-*•]|\d{1,2}[.)])\s+/, '')),
              )}</li>`,
          )
          .join('');
        const tag = ordered ? 'ol' : 'ul';
        return `<${tag} style="margin:0 0 16px;padding-left:22px;color:#374151;font-size:15px;line-height:1.7">${items}</${tag}>`;
      }

      const heading = lines.length === 1 && lines[0].trim().match(/^(#{1,6})\s+(.*)$/);
      if (heading) {
        return `<p style="margin:24px 0 8px;color:#111827;font-size:16px;font-weight:700;line-height:1.4">${inlineMarkdownToHtml(
          escapeHtml(heading[2].replace(/\s*#+\s*$/, '')),
        )}</p>`;
      }

      const html = lines
        .map((line) => inlineMarkdownToHtml(escapeHtml(line.replace(/^\s{0,3}#{1,6}\s+/, ''))))
        .join('<br/>');
      return `<p style="${paragraphStyle}">${html}</p>`;
    })
    .join('');
}
