"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2, Search, Users } from "lucide-react";
import { apiClient } from "@/lib/api/axios";
import type { EventDetail, EventRsvp } from "@/types";
import { PICNIC } from "@/components/picnic/picnic-config";

/** People who registered on the open /picnic page (saved as RSVPs on the picnic event). */
function usePicnicRsvps() {
  return useQuery({
    queryKey: ["picnic-rsvps"],
    queryFn: async () => {
      const events = (await apiClient.get<EventDetail[]>("/events/admin")).data;
      const picnic = events.find((e) => e.slug === PICNIC.eventSlug);
      if (!picnic) return { rsvps: [] as EventRsvp[], missing: true };
      const rsvps = (await apiClient.get<EventRsvp[]>(`/events/admin/${picnic.id}/rsvps`)).data;
      return { rsvps, missing: false };
    },
  });
}

function toCsv(rows: EventRsvp[]) {
  const esc = (v: string | number | null) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["Name", "WhatsApp", "Email", "People", "Member", "Registered"];
  const body = rows.map((r) =>
    [r.fullName, r.phone, r.email, r.attendees, r.isMember ? "Yes" : "No", new Date(r.createdAt).toLocaleString("en-GB")].map(esc).join(","),
  );
  return [head.join(","), ...body].join("\n");
}

export default function PublicPicnicSignups() {
  const { data, isLoading, isError, refetch } = usePicnicRsvps();
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const all = data?.rsvps ?? [];
    const q = query.trim().toLowerCase();
    return q ? all.filter((r) => [r.fullName, r.phone, r.email].some((v) => v?.toLowerCase().includes(q))) : all;
  }, [data?.rsvps, query]);
  const people = (data?.rsvps ?? []).reduce((n, r) => n + r.attendees, 0);

  function download() {
    const blob = new Blob([toCsv(data?.rsvps ?? [])], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "picnic-registrations.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#E7DCC8] bg-[#FFFDF8] dark:border-white/10 dark:bg-white/[0.02]">
      <header className="flex flex-wrap items-center gap-3 border-b border-[#EFE6D6] px-5 py-4 dark:border-white/[0.06]">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-[#111] dark:text-white">Public picnic sign-ups</h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-white/50">
            Anyone can register on the{" "}
            <a href={PICNIC.path} target="_blank" rel="noopener noreferrer" className="font-medium text-[#87102C] underline-offset-2 hover:underline dark:text-[#FFB3C1]">
              picnic page
            </a>
            , no account needed.
            {data && !data.missing && ` ${data.rsvps.length} registration${data.rsvps.length === 1 ? "" : "s"}, ${people} ${people === 1 ? "person" : "people"} in total.`}
          </p>
        </div>
        <div className="relative w-full sm:w-56">
          <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <label htmlFor="picnic-search" className="sr-only">Search public sign-ups</label>
          <input id="picnic-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, phone or email"
            className="h-10 w-full rounded-xl border border-[#E7DCC8] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#87102C]/40 dark:border-white/10 dark:bg-white/[0.04] dark:text-white" />
        </div>
        <button type="button" onClick={download} disabled={!data?.rsvps.length}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#E7DCC8] bg-white px-3.5 text-sm font-semibold text-[#1E3A2A] hover:border-[#1E3A2A]/40 disabled:opacity-40 dark:border-white/10 dark:bg-transparent dark:text-white/80">
          <Download size={15} aria-hidden="true" /> CSV
        </button>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-14 text-gray-400"><Loader2 className="animate-spin" aria-label="Loading" /></div>
      ) : isError || !data ? (
        <div role="alert" className="p-6 text-sm text-gray-700 dark:text-white/75">
          The public sign-ups could not load. <button type="button" onClick={() => refetch()} className="font-semibold underline">Try again</button>
        </div>
      ) : data.missing ? (
        <p className="px-6 py-12 text-center text-sm text-gray-600 dark:text-white/70">
          The picnic event (&quot;{PICNIC.eventSlug}&quot;) was not found in Events, so public sign-ups have nowhere to go.
        </p>
      ) : rows.length === 0 ? (
        <p className="px-6 py-12 text-center text-sm text-gray-600 dark:text-white/70">
          {query ? "Nobody matches that search." : "No public sign-ups yet."}
        </p>
      ) : (
        <ul className="divide-y divide-[#EFE6D6] dark:divide-white/[0.06]">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-semibold text-[#111] dark:text-white">
                  {r.fullName}
                  {r.isMember && <span className="rounded-full bg-[#1E3A2A]/10 px-2 py-0.5 text-[11px] font-medium text-[#1E3A2A] dark:bg-white/10 dark:text-white/70">Member</span>}
                </p>
                <p className="truncate text-xs text-gray-500 dark:text-white/50">{[r.phone, r.email].filter(Boolean).join(" · ")}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FBF1E0] px-2.5 py-1 text-xs font-semibold text-[#87102C] dark:bg-[#87102C]/20 dark:text-[#FFB3C1]">
                <Users size={13} aria-hidden="true" /> {r.attendees === 1 ? "1 person" : `${r.attendees} people`}
              </span>
              <span className="w-full text-xs text-gray-400 sm:w-auto">{new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
