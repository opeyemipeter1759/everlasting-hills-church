/**
 * Getting CMS content ready to save.
 *
 * List fields are typed one item per line, so a blank line between paragraphs
 * (or a final Enter) used to arrive as an empty item, and the server refused
 * the whole save. tidyContent() drops blank items from every list of text, at
 * any depth, and leaves everything else as it is.
 */
export function tidyContent<T>(value: T): T {
  if (Array.isArray(value)) {
    const kept = value.filter((item) => !(typeof item === "string" && item.trim() === ""));
    return kept.map((item) => tidyContent(item)) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, tidyContent(v)])) as T;
  }
  return value;
}

/** Field paths the server names (setman.paragraphs.5) in words people use. */
function fieldName(path: string): string {
  return path
    .split(".")
    .map((part) => (/^\d+$/.test(part) ? `item ${Number(part) + 1}` : part.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase()))
    .join(" › ");
}

/** A failed save or publish as one readable sentence, naming the fields that need fixing. */
export function cmsSaveError(err: unknown): string {
  const e = err as { message?: string; details?: unknown } | null;
  const details = Array.isArray(e?.details) ? (e!.details as { path?: string; message?: string }[]) : [];
  const fields = details
    .filter((d) => d && typeof d.path === "string")
    .slice(0, 3)
    .map((d) => `${fieldName(d.path!)}: ${d.message ?? "check this field"}`);
  if (fields.length) return `Not saved. Fix ${fields.join("; ")}${details.length > 3 ? ` (and ${details.length - 3} more)` : ""}.`;
  return `Not saved: ${e?.message ?? "something went wrong. Try again."}`;
}
