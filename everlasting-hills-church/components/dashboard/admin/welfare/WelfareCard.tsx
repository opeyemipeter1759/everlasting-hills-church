import { Mail, Phone } from "lucide-react";
import type { WelfareRequestRow } from "@/lib/api/welfare";
import { URGENCY_STYLE } from "./shared";
import WelfareCardHeader from "./WelfareCardHeader";
import WelfareStatusActions from "./WelfareStatusActions";

/** One welfare request: who asked, the need, their circumstances, contact details and next steps. */
export default function WelfareCard({ r, onDelete }: { r: WelfareRequestRow; onDelete: () => void }) {
  const email = r.member?.email ?? r.email;
  const phone = r.member?.phone ?? r.phone;
  const urgency = URGENCY_STYLE[r.urgency] ?? URGENCY_STYLE.LOW;

  return (
    <div
      className={`rounded-2xl border bg-white dark:bg-[#161618] p-5 space-y-3 ${
        r.status === "PENDING"
          ? "border-l-4 border-l-amber-400 border-gray-200 dark:border-l-amber-500 dark:border-white/10"
          : r.urgency === "HIGH" && r.status !== "RESOLVED" && r.status !== "DECLINED"
          ? "border-l-4 border-l-rose-500 border-gray-200 dark:border-l-rose-500 dark:border-white/10"
          : "border-gray-200 dark:border-white/10"
      }`}
    >
      <WelfareCardHeader r={r} onDelete={onDelete} />

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-2 py-0.5 text-[10px] font-bold text-gray-600 dark:text-white/60">
          {r.category}
        </span>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${urgency.className}`}>
          {urgency.label}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500 dark:text-white/50">
        <span>Attending {r.attendanceLength}</span>
        <span>{r.occupation}</span>
        <span>{r.address}</span>
      </div>

      <p className="whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-white/80">{r.description}</p>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 dark:border-white/[0.06] pt-3">
        {(email || phone) ? (
          <div className="flex flex-wrap items-center gap-4 text-[12px] text-gray-500 dark:text-white/50">
            {email && <span className="inline-flex items-center gap-1.5"><Mail size={12} /> {email}</span>}
            {phone && <span className="inline-flex items-center gap-1.5"><Phone size={12} /> {phone}</span>}
          </div>
        ) : <span />}
        <WelfareStatusActions r={r} />
      </div>
    </div>
  );
}
