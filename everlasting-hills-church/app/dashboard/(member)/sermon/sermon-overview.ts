import type { MemberSermonOverview } from "@/lib/api";
import type { SeedEntry } from "@/lib/api/QueryHydration";

export type SermonOverview = MemberSermonOverview;

/**
 * The /sermons/me/overview answer under the keys the page's hooks read:
 * - the whole answer for useMemberSermonStats/History/Bookmarks, which are
 *   views of one overview query (only when none of their parts failed, so a
 *   failure makes them fetch the overview again instead of showing blanks);
 * - the published list for usePublishedSermons, keyed with `{}` because it
 *   defaults its filters to {} and the library grid passes {} while unsearched.
 * sermon-overview.test.tsx checks each key against its hook.
 */
export function sermonOverviewEntries(data: SermonOverview | null): SeedEntry[] {
  if (!data) return [];
  const failed = new Set(data.unavailable);
  const entries: SeedEntry[] = [];
  if (!["stats", "history", "bookmarks"].some((part) => failed.has(part))) {
    entries.push({ key: ["sermons", "me", "overview"], value: data });
  }
  if (!failed.has("published") && data.published != null) {
    entries.push({ key: ["sermons", "published", {}], value: data.published });
  }
  return entries;
}
