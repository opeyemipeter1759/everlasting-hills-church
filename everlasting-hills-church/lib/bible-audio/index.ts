/**
 * Recorded Bible readings.
 *
 * Winfred W. Henson's reading of the World English Bible, one file per
 * chapter, hosted by eBible.org and in the public domain. The chapter list is
 * built by scripts/build-bible-audio-manifest.mjs and loaded only when a
 * member reads in the WEB, so it stays out of every other page's bundle.
 */

/** Translations with a recording, by their code. */
export const RECORDED_TRANSLATIONS = ["WEB"] as const;

export const RECORDING_CREDIT =
  "Read by Winfred W. Henson. World English Bible, public domain, from eBible.org.";

export type ChapterManifest = Record<string, string[]>;

export function hasRecording(translationCode: string | null | undefined): boolean {
  return !!translationCode && (RECORDED_TRANSLATIONS as readonly string[]).includes(translationCode.toUpperCase());
}

/** Book and chapter of a verse id (book × 1,000,000 + chapter × 1,000 + verse). */
export function verseChapter(verseId: number): { bookId: number; chapter: number } {
  return { bookId: Math.floor(verseId / 1_000_000), chapter: Math.floor(verseId / 1000) % 1000 };
}

export function chapterAudioUrl(manifest: ChapterManifest, bookId: number, chapter: number): string | null {
  return manifest[String(bookId)]?.[chapter - 1] ?? null;
}

let loading: Promise<ChapterManifest> | null = null;

export function loadChapterManifest(): Promise<ChapterManifest> {
  loading ??= import("./web-chapters.json")
    .then((module) => (module.default ?? module) as unknown as ChapterManifest)
    .catch((error) => {
      loading = null;
      throw error;
    });
  return loading;
}
