import type { LatestSermon } from "@/types";

/**
 * Searching, filtering and sorting the public sermons library. All published
 * sermons are loaded once and filtered in the browser, so every filter answers
 * instantly and the counts beside each option are always right.
 */

export type SortKey = "newest" | "oldest" | "title";
export const SORTS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "title", label: "Title A–Z" },
];

export interface LibraryFilters {
  search: string;
  year: string | null;
  speaker: string | null;
  series: string | null;
  sort: SortKey;
}
export const NO_FILTERS: LibraryFilters = { search: "", year: null, speaker: null, series: null, sort: "newest" };

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'" };

/** Text from YouTube/RSS imports can arrive HTML-escaped ("Strangers &amp; Pilgrims"); show it as written. */
export function cleanText(text: string | null | undefined): string {
  let out = text ?? "";
  // Twice, for text that was escaped twice (&amp;amp;).
  for (let i = 0; i < 2; i++) {
    out = out.replace(/&(amp|lt|gt|quot|apos|nbsp|#39);/gi, (_, e: string) => ENTITIES[e.toLowerCase()] ?? _);
    out = out.replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)));
  }
  return out.replace(/\s+/g, " ").trim();
}

/** "Pastor Opeyemi  Peter." and "Pastor Opeyemi Peter" are one speaker. */
export function speakerName(s: Pick<LatestSermon, "speaker">): string {
  return cleanText(s.speaker).replace(/[.,;:\s]+$/, "") || "Guest speaker";
}
const speakerKey = (s: Pick<LatestSermon, "speaker">) => speakerName(s).toLowerCase();

export const seriesName = (s: Pick<LatestSermon, "series">) => cleanText(s.series) || null;
export const sermonYear = (s: Pick<LatestSermon, "date" | "publishedAt">) => (s.date || s.publishedAt || "").slice(0, 4);
const dateMs = (s: Pick<LatestSermon, "date" | "publishedAt">) => new Date(s.date || s.publishedAt).getTime() || 0;

export interface Option {
  value: string;
  label: string;
  count: number;
}

/** Each distinct value with how many sermons have it, most common first (years: newest first). */
function tally(sermons: LatestSermon[], keyOf: (s: LatestSermon) => string | null, labelOf: (s: LatestSermon) => string): Option[] {
  const map = new Map<string, Option>();
  for (const s of sermons) {
    const value = keyOf(s);
    if (!value) continue;
    const found = map.get(value);
    if (found) found.count++;
    else map.set(value, { value, label: labelOf(s), count: 1 });
  }
  return Array.from(map.values());
}

export function libraryOptions(sermons: LatestSermon[]) {
  const byName = (a: Option, b: Option) => a.label.localeCompare(b.label);
  return {
    years: tally(sermons, sermonYear, sermonYear).sort((a, b) => b.value.localeCompare(a.value)),
    speakers: tally(sermons, speakerKey, speakerName).sort(byName),
    series: tally(sermons, (s) => seriesName(s)?.toLowerCase() ?? null, (s) => seriesName(s) ?? "").sort(byName),
  };
}

export function applyFilters(sermons: LatestSermon[], f: LibraryFilters): LatestSermon[] {
  const words = f.search.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = sermons.filter((s) => {
    if (f.year && sermonYear(s) !== f.year) return false;
    if (f.speaker && speakerKey(s) !== f.speaker) return false;
    if (f.series && seriesName(s)?.toLowerCase() !== f.series) return false;
    if (!words.length) return true;
    const haystack = [s.title, s.speaker, s.series, s.description, s.scriptureRef, ...(s.tags ?? [])].map(cleanText).join(" ").toLowerCase();
    return words.every((w) => haystack.includes(w));
  });
  if (f.sort === "title") return matches.sort((a, b) => cleanText(a.title).localeCompare(cleanText(b.title)));
  return matches.sort((a, b) => (f.sort === "oldest" ? dateMs(a) - dateMs(b) : dateMs(b) - dateMs(a)));
}

/** "24 Nov 2026", as on the cards. */
export const cardDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** 2270 → "37:50"; 5055 → "1:24:15". */
export function clockDuration(seconds: number | null | undefined): string | null {
  if (!seconds || seconds <= 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const sec = Math.floor(seconds % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}
