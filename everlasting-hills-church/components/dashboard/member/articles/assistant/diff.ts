export type DiffPart = { kind: "same" | "add" | "del"; text: string };

const DIFF_TOKEN_LIMIT = 2_500;

/** Word-level diff (longest common subsequence). Null when too long to compare quickly. */
export function diffWords(before: string, after: string): DiffPart[] | null {
  const a = before.split(/(\s+)/).filter(Boolean);
  const b = after.split(/(\s+)/).filter(Boolean);
  if (a.length > DIFF_TOKEN_LIMIT || b.length > DIFF_TOKEN_LIMIT) return null;
  const n = a.length;
  const m = b.length;
  const table = new Uint16Array((n + 1) * (m + 1));
  const at = (i: number, j: number) => i * (m + 1) + j;
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      table[at(i, j)] = a[i] === b[j] ? table[at(i + 1, j + 1)] + 1 : Math.max(table[at(i + 1, j)], table[at(i, j + 1)]);
    }
  }
  const parts: DiffPart[] = [];
  const push = (kind: DiffPart["kind"], text: string) => {
    const last = parts[parts.length - 1];
    if (last?.kind === kind) last.text += text;
    else parts.push({ kind, text });
  };
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      push("same", a[i]);
      i += 1;
      j += 1;
    } else if (table[at(i + 1, j)] >= table[at(i, j + 1)]) {
      push("del", a[i++]);
    } else {
      push("add", b[j++]);
    }
  }
  while (i < n) push("del", a[i++]);
  while (j < m) push("add", b[j++]);
  return coalesce(parts);
}

/**
 * Joins edits separated only by a space, so "i has" → "I have" shows as one
 * crossed-out phrase and one new phrase, not alternating single words.
 */
function coalesce(parts: DiffPart[]): DiffPart[] {
  const out: DiffPart[] = [];
  let del = "";
  let add = "";
  let gap = "";
  const flush = () => {
    if (del) out.push({ kind: "del", text: del });
    if (add) out.push({ kind: "add", text: add });
    del = "";
    add = "";
  };
  for (const part of parts) {
    if (part.kind === "same") {
      if (/^\s+$/.test(part.text) && (del || add)) {
        gap += part.text;
        continue;
      }
      flush();
      out.push({ kind: "same", text: gap + part.text });
      gap = "";
      continue;
    }
    if (gap) {
      if (del) del += gap;
      if (add) add += gap;
      gap = "";
    }
    if (part.kind === "del") del += part.text;
    else add += part.text;
  }
  flush();
  if (gap) out.push({ kind: "same", text: gap });
  return out;
}
