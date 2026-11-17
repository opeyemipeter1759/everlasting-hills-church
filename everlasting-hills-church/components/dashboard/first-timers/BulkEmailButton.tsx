"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { showToast } from "@/components/ui/toast/toast";
import type { ApiError } from "@/lib/api/axios";
import { sendOpeningEmails, type EmailResult } from "@/lib/api/opening-message";

/** How many people each request emails; the API takes up to 25 and a round stays inside the request timeout. */
const ROUND = 6;

/**
 * Emails everyone on the list who gave an address, a few at a time, and says
 * plainly who did not get it when the day's email allowance runs out.
 */
export function BulkEmailButton({ people, onDone }: { people: { visitorId: string; firstName: string }[]; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [missed, setMissed] = useState<EmailResult[]>([]);

  async function run() {
    const results: EmailResult[] = [];
    setProgress(0);
    try {
      for (let i = 0; i < people.length; i += ROUND) {
        const round = await sendOpeningEmails(people.slice(i, i + ROUND).map((p) => p.visitorId));
        results.push(...round);
        setProgress(results.length);
      }
    } catch (err) {
      showToast.error((err as ApiError)?.message || "Sending stopped part way. Those not yet emailed are still on the list.");
    }
    const sent = results.filter((r) => r.status === "SENT").length;
    const notSent = results.filter((r) => r.status !== "SENT");
    setMissed(notSent);
    setProgress(null);
    setOpen(false);
    if (sent) showToast.success(`Emailed ${sent} ${sent === 1 ? "person" : "people"}`);
    onDone();
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-white/15 dark:text-white/85 dark:hover:bg-white/10"
      >
        <Mail size={16} aria-hidden="true" /> Email all {people.length} with an address
      </button>
      {missed.length > 0 && (
        <div className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200" role="status">
          <p className="font-semibold">These people did not get an email:</p>
          <ul className="mt-1 list-disc pl-5">
            {missed.map((m) => (
              <li key={m.visitorId}>
                {m.name}: {m.status === "SKIPPED" ? "today's email allowance ran out" : m.status === "NO_EMAIL" ? "no email address" : "it did not go through"}
              </li>
            ))}
          </ul>
          <p className="mt-1">They are still on the list. Send them a WhatsApp, or email them tomorrow.</p>
        </div>
      )}
      <ConfirmDialog
        open={open}
        title={`Email ${people.length} ${people.length === 1 ? "person" : "people"}?`}
        description={
          progress === null
            ? "Everyone below with an email address gets the opening message, and leaves this list. Sending stops when today's email allowance runs out, and you will see who missed out."
            : `Sending ${progress} of ${people.length}...`
        }
        confirmLabel="Send the emails"
        tone="info"
        loading={progress !== null}
        onConfirm={run}
        onCancel={() => progress === null && setOpen(false)}
      />
    </div>
  );
}
