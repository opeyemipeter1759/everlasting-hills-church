"use client";

import { useState } from "react";
import Link from "next/link";
import { PenLine } from "lucide-react";
import { useOpeningQueue } from "@/lib/api/opening-message";
import { useRefreshFollowUp } from "@/lib/api/first-timer-profile";
import { PeopleTable } from "@/components/dashboard/follow-up/v2/PeopleTable";
import { BulkEmailButton } from "./BulkEmailButton";
import { WhatsAppSendButton } from "./WhatsAppSendButton";

/**
 * The first-timer contact's workspace: everyone nobody has contacted yet,
 * oldest first. One tap sends the opening message on WhatsApp and logs it,
 * and the person leaves the list.
 */
export default function FirstTimerWorkspace() {
  const queue = useOpeningQueue();
  const refresh = useRefreshFollowUp();
  const [done, setDone] = useState<string[]>([]);

  const rows = (queue.data?.rows ?? []).filter((r) => !done.includes(r.person.visitorId));
  const byId = new Map(rows.map((r) => [r.person.visitorId, r]));
  const withEmail = rows.filter((r) => r.person.email).map((r) => ({ visitorId: r.person.visitorId, firstName: r.person.firstName }));
  const hasTemplate = !!queue.data?.template;

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-5 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#87102C] dark:text-[#FFB3C1]">First-timers</p>
          <h1 className="mt-1 text-2xl font-bold text-[#111] dark:text-white">Welcome queue</h1>
          <p className="mt-1 max-w-xl text-sm text-gray-600 dark:text-white/60">
            {queue.data
              ? `${rows.length} ${rows.length === 1 ? "person" : "people"} from the last ${queue.data.windowDays} days nobody has contacted yet, oldest first. Send each one the opening message and they leave this list.`
              : "Everyone nobody has contacted yet, oldest first."}
          </p>
        </div>
        <Link
          href="/dashboard/first-timers/messages"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-white/15 dark:text-white/85 dark:hover:bg-white/10"
        >
          <PenLine size={16} aria-hidden="true" /> Edit the message
        </Link>
      </header>

      {queue.isError && (
        <p className="rounded-2xl border border-dashed border-gray-300 px-5 py-8 text-center text-sm text-gray-500 dark:border-white/15 dark:text-white/50">
          The list could not be loaded. Check your connection and try again.
        </p>
      )}

      {queue.data && !hasTemplate && (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          Write the opening message before you send it.{" "}
          <Link href="/dashboard/first-timers/messages" className="font-semibold underline underline-offset-2">
            Write it now
          </Link>
        </p>
      )}

      {hasTemplate && withEmail.length > 0 && <BulkEmailButton people={withEmail} onDone={refresh} />}

      {!queue.isError && (
        <PeopleTable
          rows={rows.map((r) => r.person)}
          loading={queue.isLoading}
          profileHref={(row) => `/dashboard/follow-up/person/${row.visitorId}`}
          empty="Everyone has had their opening message. Thank you."
          renderActions={(row) => {
            const whatsapp = byId.get(row.visitorId)?.whatsapp;
            if (!hasTemplate) return null;
            if (!whatsapp) return <span className="text-xs text-gray-500 dark:text-white/45">No phone</span>;
            return (
              <WhatsAppSendButton
                compact
                visitorId={row.visitorId}
                firstName={row.firstName}
                whatsapp={whatsapp}
                onLogged={() => {
                  setDone((d) => [...d, row.visitorId]);
                  refresh();
                }}
              />
            );
          }}
        />
      )}
    </div>
  );
}
