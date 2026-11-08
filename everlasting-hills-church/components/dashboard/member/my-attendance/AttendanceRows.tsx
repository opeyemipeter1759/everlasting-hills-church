import { CalendarCheck, CheckCircle2, XCircle } from "lucide-react";
import type { AttendanceRow } from "./attendance-data";

const CELL = "px-4 py-3 whitespace-nowrap";

/** One attendance record as a table row. */
export function AttendanceTableRow({ r, striped }: { r: AttendanceRow; striped: boolean }) {
  const present = r.status === "present";
  return (
    <tr className={`transition-colors hover:bg-[#FFF4F6]/60 dark:hover:bg-white/[0.03] ${striped ? "bg-[#FFFBFC] dark:bg-white/[0.012]" : ""}`}>
      <td className={`${CELL} text-[#8a7e80] dark:text-white/50`}>{r.id}</td>
      <td className={`${CELL} font-semibold text-[#111] dark:text-white`}>{r.name}</td>
      <td className={CELL}>
        {r.email === "—" ? (
          <span className="text-[#b8a8ac] dark:text-white/30">—</span>
        ) : (
          <a href={`mailto:${r.email}`} className="text-[#87102C] dark:text-[#FFB3C1] hover:underline">{r.email}</a>
        )}
      </td>
      <td className={`${CELL} text-[#555] dark:text-white/60`}>{r.phone}</td>
      <td className={`${CELL} text-[#555] dark:text-white/70`}>{r.service}</td>
      <td className={`${CELL} text-[#555] dark:text-white/60`}>{r.date}</td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
            present
              ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
              : "bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400"
          }`}
        >
          {present ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
          {r.status}
        </span>
      </td>
      <td className="px-4 py-3">
        {r.mode === "--" ? (
          <span className="text-[#b8a8ac] dark:text-white/30">--</span>
        ) : (
          <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFE8ED] dark:bg-[#87102C]/25 text-[#87102C] dark:text-[#FFB3C1]">
            {r.mode}
          </span>
        )}
      </td>
    </tr>
  );
}

/** Shown when no record matches. */
export function EmptyRow({ cols }: { cols: number }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-16">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF4F6] dark:bg-white/5">
            <CalendarCheck size={18} className="text-[#87102C]/50 dark:text-white/30" />
          </span>
          <p className="text-sm font-semibold text-[#111] dark:text-white">No records found</p>
          <p className="text-xs text-[#8a7e80] dark:text-white/40">Try adjusting or clearing your filters.</p>
        </div>
      </td>
    </tr>
  );
}

/** Placeholder rows while the history loads. */
export function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3.5">
              <div className="h-3 animate-pulse rounded bg-[#F0DCE1] dark:bg-white/[0.06]" style={{ width: `${50 + ((i + j) % 4) * 10}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
