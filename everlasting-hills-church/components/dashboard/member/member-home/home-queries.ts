"use client";

import { dehydrate, QueryClient, type DehydratedState } from "@tanstack/react-query";
import { normalizePledge } from "@/lib/api/pledges";
import type { MemberHomeData } from "@/app/dashboard/(dashboard)/_loaders/member-home/types";

/**
 * The cards on the home page each read their own query (useGatherings,
 * useMySpouse, …). This fills those queries from the one /member-home answer,
 * so on first load no card has to fetch; later refreshes (polling, refetch
 * after an action) still go to each card's own endpoint.
 *
 * Keys must match the hooks exactly; home-queries.test.tsx checks each one.
 */
export function homeQueryEntries(data: MemberHomeData): Array<{ key: readonly unknown[]; section: string; value: unknown }> {
  const translations = data.scripture.translations?.map(({ code, name, isDefault }) => ({ code, name, isDefault })) ?? null;
  return [
    { key: ["attendance", "can-mark"], section: "canMark", value: data.canMark },
    { key: ["gatherings", "active"], section: "gatherings", value: data.gatherings },
    { key: ["members", "me", "spouse"], section: "spouse", value: data.spouse },
    { key: ["evangelism", "mine", "tally"], section: "evangelismTally", value: data.evangelismTally },
    { key: ["prayer-watch", "mine"], section: "prayerWatch", value: data.prayerWatch },
    { key: ["one-on-one", "mine"], section: "oneOnOneRequests", value: data.oneOnOneRequests },
    { key: ["reading-plan", "me", "today", "active"], section: "readingToday", value: data.readingPlan.today },
    { key: ["reading-plan", "me", "subscriptions"], section: "readingSubscriptions", value: data.readingPlan.subscriptions },
    { key: ["pledges", data.pledgeCampaign, "mine"], section: "pledge", value: data.pledge && normalizePledge(data.pledge) },
    { key: ["bible", "today", "default"], section: "scriptureToday", value: data.scripture.today },
    { key: ["bible", "scripture-versions"], section: "scriptureTranslations", value: translations },
    { key: ["sermon-digest", "latest"], section: "latestSermon", value: data.latestSermon },
  ];
}

/** Sections whose null means "failed" rather than "nothing": never cache those. */
const NULL_MEANS_FAILED = new Set(["canMark", "gatherings", "spouse", "evangelismTally", "oneOnOneRequests", "readingSubscriptions", "scriptureToday", "scriptureTranslations", "latestSermon"]);

export function dehydrateHome(data: MemberHomeData): DehydratedState {
  const client = new QueryClient();
  const failed = new Set(data.unavailable);
  for (const { key, section, value } of homeQueryEntries(data)) {
    if (failed.has(section)) continue;
    if (value == null && NULL_MEANS_FAILED.has(section)) continue;
    client.setQueryData(key, value);
  }
  return dehydrate(client);
}
