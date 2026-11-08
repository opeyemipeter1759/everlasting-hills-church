import type { ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { useMemberSermonBookmarks, useMemberSermonHistory, useMemberSermonStats, usePublishedSermons } from "@/lib/api";
import { QueryHydration } from "@/lib/api/QueryHydration";
import { sermonOverviewEntries, type SermonOverview } from "./sermon-overview";

const DATA = {
  stats: { completed: 2, inProgress: 1, bookmarked: 3 },
  published: [{ slug: "s1" }],
  history: [{ positionSec: 30 }],
  bookmarks: [{ id: "b1" }],
  unavailable: [],
} as unknown as SermonOverview;

function wrapper(data: SermonOverview) {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <QueryHydration entries={sermonOverviewEntries(data)}>{children}</QueryHydration>
      </QueryClientProvider>
    );
  };
}

const SECTIONS: Array<[string, () => { data: unknown; isFetching: boolean }, unknown]> = [
  ["stat tiles", () => useMemberSermonStats(), DATA.stats],
  ["library and Recently Added", () => usePublishedSermons(), DATA.published],
  ["the Full Library grid's empty search", () => usePublishedSermons({}), DATA.published],
  ["Continue Listening", () => useMemberSermonHistory(), DATA.history],
  ["Saved", () => useMemberSermonBookmarks(), DATA.bookmarks],
];

describe("My Sermons reads the one /sermons/me/overview answer", () => {
  it.each(SECTIONS)("%s finds its data without a request of its own", (_name, useSection, expected) => {
    const { result } = renderHook(useSection, { wrapper: wrapper(DATA) });
    expect(result.current.data).toEqual(expected);
    expect(result.current.isFetching).toBe(false);
  });

  it("leaves a failed part for its section to fetch", () => {
    const keys = (data: SermonOverview) => sermonOverviewEntries(data).map((e) => e.key.join("/"));
    expect(keys({ ...DATA, published: null, unavailable: ["published"] })).toEqual(["sermons/me/overview"]);
    // A failed personal part: the overview is not cached, so its hooks fetch it again.
    expect(keys({ ...DATA, stats: null, unavailable: ["stats"] })).not.toContain("sermons/me/overview");
    expect(sermonOverviewEntries(null)).toEqual([]);
  });

  it("serves stats, history and saved from one shared query", () => {
    const { result } = renderHook(() => [useMemberSermonStats(), useMemberSermonHistory(), useMemberSermonBookmarks()], { wrapper: wrapper(DATA) });
    expect(result.current.map((q) => q.data)).toEqual([DATA.stats, DATA.history, DATA.bookmarks]);
  });
});
