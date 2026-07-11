import { CheckCircle2, XCircle } from "lucide-react";
import { fmtDate } from "../peopleShared";
import { Empty } from "./shared";
import type { MemberDetail } from "./types";

export default function AttendanceSection({ records }: { records: MemberDetail["AttendanceRecord"] }) {
  if (records.length === 0) return <Empty>No attendance records yet.</Empty>;
  return (
    <ul className="divide-y divide-[#E7CDD3]/40 dark:divide-white/[0.06]">
      {records.map((a) => (
        <li key={a.id} className="flex items-center justify-between py-2.5">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{a.Service.name}</p>
            <p className="text-xs text-gray-400 dark:text-white/40">{fmtDate(a.Service.scheduledAt)}</p>
          </div>
          {a.present ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 size={14} /> Present
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 dark:text-white/40">
              <XCircle size={14} /> Absent
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
