/** Strips tags, collapsing block boundaries to spaces so words don't run
 * together — used for card previews and length validation. */
export function toPlainText(html: string): string {
  if (typeof document === "undefined") return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent ?? "").replace(/\s+/g, " ").trim();
}

/** Plain-text length of an HTML string — used to validate real content instead
 * of raw markup length (an "empty" editor still emits "<p></p>"). */
export function textLength(html: string): number {
  return toPlainText(html).length;
}

/** Shared with the read-only report view so edited and displayed content look identical. */
export const PROSE_CLASSES =
  "break-words [&_.ProseMirror]:outline-none " +
  "[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-400 dark:[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-white/25 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] " +
  "[&_h2]:mb-1.5 [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-gray-900 dark:[&_h2]:text-white [&_h2]:first:mt-0 " +
  "[&_p]:my-1.5 [&_p]:first:mt-0 " +
  "[&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:space-y-0.5 [&_ul]:pl-5 " +
  "[&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:space-y-0.5 [&_ol]:pl-5 " +
  "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-[#87102C]/30 dark:[&_blockquote]:border-[#e8768a]/30 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-gray-600 dark:[&_blockquote]:text-white/60 " +
  "[&_hr]:my-4 [&_hr]:border-gray-200 dark:[&_hr]:border-white/10 " +
  "[&_strong]:font-bold [&_em]:italic";
