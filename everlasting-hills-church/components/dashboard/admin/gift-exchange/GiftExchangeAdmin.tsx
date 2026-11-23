"use client";

import { useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useGiftEntries, type GiftEntriesFilter } from "@/lib/api/gift-exchange";
import GiftAdminHero from "./GiftAdminHero";
import GiftStats, { type GiftFilter } from "./GiftStats";
import GiftEntryRow from "./GiftEntryRow";

const TITLES: Record<GiftFilter | "all", string> = {
  all: "Everyone who signed up",
  GIFT_EXCHANGE: "Gift exchange: will be paired",
  PICNIC: "Coming to the picnic",
  REJECTED: "Rejected: not taking part",
};

/** What each filter asks the API for. Activity lists only show people still in. */
const QUERY: Record<GiftFilter, GiftEntriesFilter> = {
  GIFT_EXCHANGE: { status: "INTERESTED", activity: "GIFT_EXCHANGE" },
  PICNIC: { status: "INTERESTED", activity: "PICNIC" },
  REJECTED: { status: "REJECTED" },
};

/** The gift exchange & picnic at a glance: when it is, how many are in for each, and everyone who signed up. */
export default function GiftExchangeAdmin() {
  const [filter, setFilter] = useState<GiftFilter | null>(null);
  const [query, setQuery] = useState("");
  const { data, isLoading, isError, refetch } = useGiftEntries(filter ? QUERY[filter] : {});

  const entries = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = data?.entries ?? [];
    return q ? all.filter((e) => [e.name, e.phone, e.email].some((v) => v?.toLowerCase().includes(q))) : all;
  }, [data?.entries, query]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-5">
      <GiftAdminHero targetDate={data?.targetDate ?? null} />
      <GiftStats counts={data?.counts ?? null} selected={filter} onSelect={setFilter} />

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.02]">
        <header className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-5 py-4 dark:border-white/[0.06]">
          <h2 className="flex-1 text-base font-bold text-[#111] dark:text-white">{TITLES[filter ?? "all"]}</h2>
          <div className="relative w-full sm:w-64">
            <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <label htmlFor="gift-search" className="sr-only">Search by name, phone or email</label>
            <input id="gift-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, phone or email"
              className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm outline-none focus:border-[#87102C]/40 focus:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-white" />
          </div>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-16 text-gray-400"><Loader2 className="animate-spin" aria-label="Loading" /></div>
        ) : isError || !data ? (
          <div role="alert" className="p-6 text-sm text-gray-700 dark:text-white/75">
            The list could not load. <button type="button" onClick={() => refetch()} className="font-semibold underline">Try again</button>
          </div>
        ) : entries.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-semibold text-gray-700 dark:text-white/80">
              {query ? "Nobody matches that search." : filter ? "Nobody here yet." : "Nobody has signed up yet."}
            </p>
            {!query && !filter && <p className="mt-1 text-xs text-gray-500 dark:text-white/45">Members sign up from the Gift exchange &amp; picnic card on their dashboard.</p>}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
            {entries.map((e) => <GiftEntryRow key={e.id} entry={e} />)}
          </ul>
        )}
      </section>
    </div>
  );
}
