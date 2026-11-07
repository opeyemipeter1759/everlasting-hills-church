/**
 * Converts between an article body (the Markdown subset in lib/rich-text.ts,
 * which is what every reader renders) and the visual editor's document.
 *
 * Reading goes through parseBlocks, the same parser the reader uses, so the
 * editor shows exactly what the published page will. Writing emits only
 * syntax that parser understands, ordered so it reads back the same way.
 */
export { SAFE_HREF } from "./safe-href";
export { markdownToDoc } from "./to-doc";
export { docToMarkdown } from "./to-markdown";
