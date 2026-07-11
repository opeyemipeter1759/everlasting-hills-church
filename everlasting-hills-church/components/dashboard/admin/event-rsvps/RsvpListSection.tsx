"use client";

import { Download, Search } from "lucide-react";
import type { EventDetail, EventRsvp } from "@/types";
import { useRsvpFilters } from "./useRsvpFilters";
import RsvpFilterTabs from "./RsvpFilterTabs";
import RsvpTable from "./RsvpTable";
import type { CheckInMutation } from "./useEventRsvps";

export default function RsvpListSection({
  event,
  rsvps,
  checkIn,
}: {
  event: EventDetail;
  rsvps: EventRsvp[];
  checkIn: CheckInMutation;
}) {
  const { search, setSearch, filter, setFilter, counts, filtered, exportCsv } = useRsvpFilters(rsvps, event);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <RsvpFilterTabs filter={filter} onChange={setFilter} counts={counts} />
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email…"
              className="pl-8 pr-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all w-44"
            />
          </div>
          {rsvps.length > 0 && (
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <Download size={13} /> CSV
            </button>
          )}
        </div>
      </div>

      {rsvps.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-10">No RSVPs yet.</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-10">
          No matches for this search/filter.
        </p>
      ) : (
        <RsvpTable rsvps={filtered} checkIn={checkIn} />
      )}
    </div>
  );
}
