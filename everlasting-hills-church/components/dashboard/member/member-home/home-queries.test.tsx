import type { ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { useCanMark } from "@/lib/api";
import { useDailyScripture, useScriptureVersions } from "@/lib/api/daily-scripture";
import { useMyEvangelismTally } from "@/lib/api/evangelism";
import { useMySpouse } from "@/lib/api/family";
import { useGatherings } from "@/lib/api/gatherings";
import { useMyRequests } from "@/lib/api/one-on-one";
import { useMyPledge } from "@/lib/api/pledges";
import { useMyPrayerSignup } from "@/lib/api/prayer-watch";
import { useReadingSubscriptions, useTodayReading } from "@/lib/api/reading-plan";
import { useLatestSummary } from "@/lib/sermon-digest";
import type { MemberHomeData } from "@/app/dashboard/(dashboard)/_loaders/member-home/types";
import { HomeQueryHydration } from "./HomeQueryHydration";

const DATA = {
  me: null, bookmarks: [], listenHistory: [], sermonStreak: 0, overview: null, announcements: [], communityFeed: [], communityBirthdays: [],
  spouse: { status: "SINGLE" },
  pledge: null,
  pledgeCampaign: "sound-media",
  evangelismTally: { reached: 4 },
  prayerWatch: { slot: "06:00" },
  oneOnOneRequests: [{ id: "r1" }],
  readingPlan: { today: { day: 3 }, subscriptions: [{ id: "s1" }] },
  canMark: { canMark: true },
  gatherings: [{ id: "g1" }],
  scripture: { today: { reference: "John 3:16" }, translations: [{ code: "KJV", name: "King James", isDefault: true, extra: 1 }] },
  latestSermon: { ready: false },
  unavailable: [],
} as unknown as MemberHomeData;

function wrapper(data: MemberHomeData) {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <HomeQueryHydration data={data}>{children}</HomeQueryHydration>
      </QueryClientProvider>
    );
  };
}

/** Each card's hook, and what it should find without fetching. */
const CARDS: Array<[string, () => { data: unknown; isFetching: boolean }, unknown]> = [
  ["check-in", () => useCanMark(), { canMark: true }],
  ["gatherings", () => useGatherings(), [{ id: "g1" }]],
  ["spouse", () => useMySpouse(), { status: "SINGLE" }],
  ["evangelism tally", () => useMyEvangelismTally(), { reached: 4 }],
  ["prayer watch", () => useMyPrayerSignup(), { slot: "06:00" }],
  ["one-on-one", () => useMyRequests(), [{ id: "r1" }]],
  ["today's reading", () => useTodayReading(), { day: 3 }],
  ["reading plans", () => useReadingSubscriptions(), [{ id: "s1" }]],
  ["pledge", () => useMyPledge(), null],
  ["daily scripture", () => useDailyScripture(), { reference: "John 3:16" }],
  ["bible versions", () => useScriptureVersions(), [{ code: "KJV", name: "King James", isDefault: true }]],
  ["sermon summary", () => useLatestSummary(), { ready: false }],
];

describe("home page cards read the one /member-home answer", () => {
  it.each(CARDS)("%s finds its data without a request of its own", (_name, useCard, expected) => {
    const { result } = renderHook(useCard, { wrapper: wrapper(DATA) });
    expect(result.current.data).toEqual(expected);
    expect(result.current.isFetching).toBe(false);
  });

  it("leaves a failed section for its card to fetch", () => {
    const failed = { ...DATA, gatherings: null, unavailable: ["gatherings"] } as MemberHomeData;
    const { result } = renderHook(() => useGatherings(), { wrapper: wrapper(failed) });
    expect(result.current.data).toBeUndefined();
  });
});
