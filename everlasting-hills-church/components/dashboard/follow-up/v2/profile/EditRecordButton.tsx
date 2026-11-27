"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import EditVisitorModal from "@/components/dashboard/admin/FirstTimer/EditVisitorModal";
import { FirstTimersModeProvider, TEAM_MODE } from "@/components/dashboard/admin/FirstTimer/mode";
import { useFirstTimerRecord } from "@/lib/api/first-timer-profile";

/** Saves through the Follow-Up record endpoint, which checks they are the viewer's to edit. */
const FOLLOW_UP_MODE = { ...TEAM_MODE, canEdit: true, editPath: (id: string) => `/follow-up/first-timers/${id}/record` };

/**
 * "Edit details" on a first-timer's profile, for whoever may correct their
 * record: their own Follow-Up assignee, the lead, heads of department and
 * admins. Hidden for everyone else; the API checks the same rule.
 */
export function EditRecordButton({ visitorId, onSaved }: { visitorId: string; onSaved: () => void }) {
  const { data } = useFirstTimerRecord(visitorId);
  const [open, setOpen] = useState(false);
  if (!data?.canEdit) return null;

  return (
    <FirstTimersModeProvider value={FOLLOW_UP_MODE}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-9 flex-shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/[0.06]"
      >
        <Pencil size={14} aria-hidden="true" /> Edit details
      </button>
      <EditVisitorModal visitor={open ? data.record : null} onClose={() => setOpen(false)} onUpdated={onSaved} />
    </FirstTimersModeProvider>
  );
}
