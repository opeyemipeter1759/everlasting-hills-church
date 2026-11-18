"use client";

import { useEffect, useState } from "react";
import { useOpeningEveryone } from "@/lib/api/opening-everyone";
import { useRefreshFollowUp } from "@/lib/api/first-timer-profile";
import { PeopleTable } from "@/components/dashboard/follow-up/v2/PeopleTable";
import { useDebounced } from "@/components/dashboard/follow-up/MasterListToolbar";
import { WhatsAppSendButton } from "./WhatsAppSendButton";
import { churchTime } from "./SendsList";

const PAGE = 25;

/**
 * Every first-timer ever, newest first, whatever their status: search by name
 * or phone, and send any of them the opening message on WhatsApp again.
 */
export function EveryoneList() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const settled = useDebounced(search);
  useEffect(() => setPage(0), [settled]);
  const q = useOpeningEveryone({ search: settled.trim() || undefined, take: PAGE, skip: page * PAGE });
  const refresh = useRefreshFollowUp();
  const rows = q.data?.rows ?? [];
  const byId = new Map(rows.map((r) => [r.person.visitorId, r]));
  const total = q.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));

  return (
    <div className="space-y-3">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or phone"
        aria-label="Search first-timers by name or phone"
        className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-base text-gray-900 dark:border-white/15 dark:bg-white/5 dark:text-white sm:max-w-sm sm:text-sm"
      />
      {q.isError ? (
        <p className="text-sm text-rose-600 dark:text-rose-300">The list could not be loaded. Check your connection and try again.</p>
      ) : (
        <PeopleTable
          rows={rows.map((r) => r.person)}
          loading={q.isLoading}
          profileHref={(row) => `/dashboard/follow-up/person/${row.visitorId}`}
          empty={settled ? "Nobody matches that search." : "No first-timers yet."}
          renderActions={(row) => {
            const item = byId.get(row.visitorId);
            const last = item?.lastWhatsApp;
            const sent = last && (
              <span className="block text-xs text-gray-500 dark:text-white/50">
                Sent {churchTime(last.sentAt)}{last.sentByName ? ` by ${last.sentByName}` : ""}
              </span>
            );
            if (!q.data?.template) return sent || null;
            if (!item?.whatsapp) return <div>{sent || <span className="text-xs text-gray-500 dark:text-white/45">No phone</span>}</div>;
            return (
              <div className="space-y-1">
                <WhatsAppSendButton compact visitorId={row.visitorId} firstName={row.firstName} whatsapp={item.whatsapp} onLogged={refresh} />
                {sent}
              </div>
            );
          }}
        />
      )}
      {total > PAGE && (
        <div className="flex items-center justify-between gap-3 text-sm text-gray-600 dark:text-white/60">
          <span>
            {page * PAGE + 1} to {Math.min((page + 1) * PAGE, total)} of {total}
          </span>
          <div className="flex gap-2">
            <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)}
              className="min-h-11 rounded-xl border border-gray-300 px-4 font-semibold disabled:opacity-40 dark:border-white/15">
              Newer
            </button>
            <button type="button" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}
              className="min-h-11 rounded-xl border border-gray-300 px-4 font-semibold disabled:opacity-40 dark:border-white/15">
              Older
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
