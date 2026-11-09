import Image from "next/image";
import { Check, Loader2, X } from "lucide-react";
import type { AttendanceRow } from "@/lib/api/attendance-roll";

function serviceLabel(row: AttendanceRow): string {
  const [y, m, d] = row.date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** How the row came to be: the member's own check-in (with the time), or an admin. */
function howLabel(row: AttendanceRow): string {
  if (row.markedBy === "ADMIN") return row.status === "PRESENT" ? "Marked present by an admin" : "Not checked in";
  if (!row.markedAt) return "Checked in";
  const time = new Date(row.markedAt).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", timeZone: "Africa/Lagos" });
  return `Checked in at ${time}`;
}

export default function RollRow({ row, oneService, selected, onToggle, saving, onOverride }: {
  row: AttendanceRow;
  oneService: boolean;
  selected: boolean;
  onToggle: () => void;
  saving: boolean;
  onOverride: () => void;
}) {
  const present = row.status === "PRESENT";
  return (
    <tr className={`transition-colors hover:bg-gray-50/70 dark:hover:bg-white/[0.02] ${selected ? "bg-[#87102C]/[0.03]" : ""}`}>
      <td className="py-3 pl-5">
        <input type="checkbox" checked={selected} onChange={onToggle} aria-label={`Select ${row.userName}`} className="rounded accent-[#87102C]" />
      </td>
      {/* w-full + max-w-0 lets a long name truncate instead of pushing Status off a phone screen. */}
      <td className="w-full max-w-0 px-3 py-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          {row.photoUrl ? (
            <Image src={row.photoUrl} alt="" width={32} height={32} className="h-8 w-8 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#87102C]/10 text-xs font-black uppercase text-[#87102C] dark:bg-[#87102C]/20 dark:text-[#E8768A]">
              {row.userName.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{row.userName}</p>
            {!oneService && <p className="truncate text-xs text-gray-500 dark:text-white/50 sm:hidden">{serviceLabel(row)}</p>}
          </div>
        </div>
      </td>
      {!oneService && <td className="hidden whitespace-nowrap px-4 py-3 text-xs text-gray-500 dark:text-white/55 sm:table-cell">{serviceLabel(row)}</td>}
      <td className="hidden whitespace-nowrap px-4 py-3 text-xs text-gray-500 dark:text-white/55 md:table-cell">{howLabel(row)}</td>
      <td className="py-3 pl-2 pr-4 sm:px-4">
        <button
          type="button"
          onClick={onOverride}
          disabled={saving}
          title={present ? "Mark absent" : "Mark present"}
          aria-label={`${row.userName}: ${present ? "present" : "absent"}. Change to ${present ? "absent" : "present"}`}
          className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold transition-colors disabled:opacity-70 ${
            present
              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400"
              : "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400"
          }`}
        >
          {saving ? <Loader2 size={11} className="animate-spin" /> : present ? <Check size={11} /> : <X size={11} />}
          {saving ? "Saving…" : present ? "Present" : "Absent"}
        </button>
      </td>
    </tr>
  );
}
