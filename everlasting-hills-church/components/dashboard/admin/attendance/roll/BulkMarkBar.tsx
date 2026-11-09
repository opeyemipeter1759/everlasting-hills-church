"use client";

import { useBulkMarkAttendance, type AttendanceRow } from "@/lib/api/attendance-roll";
import { showToast } from "@/components/ui/toast/toast";

/** Mark everyone ticked on this page present or absent, one request per service. */
export default function BulkMarkBar({ rows, onDone }: { rows: AttendanceRow[]; onDone: () => void }) {
  const bulkMark = useBulkMarkAttendance();

  async function mark(status: "PRESENT" | "ABSENT") {
    const bySession = rows.reduce<Record<string, string[]>>((acc, r) => {
      acc[r.sessionId] = [...(acc[r.sessionId] ?? []), r.userId];
      return acc;
    }, {});
    try {
      for (const [sessionId, userIds] of Object.entries(bySession)) {
        await bulkMark.mutateAsync({ sessionId, userIds, status });
      }
      showToast.success(`${rows.length} marked ${status === "PRESENT" ? "present" : "absent"}`);
      onDone();
    } catch {
      showToast.error("Couldn't update everyone. Please try again.");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[#87102C]/5 px-3 py-2 dark:bg-[#87102C]/10">
      <span className="text-xs font-semibold text-gray-700 dark:text-white/75">{rows.length} selected</span>
      <span className="flex-1" />
      <button type="button" onClick={() => mark("PRESENT")} disabled={bulkMark.isPending} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50 dark:bg-emerald-500/10 dark:text-emerald-400">
        Mark present
      </button>
      <button type="button" onClick={() => mark("ABSENT")} disabled={bulkMark.isPending} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 dark:bg-red-500/10 dark:text-red-400">
        Mark absent
      </button>
    </div>
  );
}
