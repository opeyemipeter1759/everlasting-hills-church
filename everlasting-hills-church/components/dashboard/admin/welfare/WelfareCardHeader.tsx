import { ShieldCheck, Trash2, UserRound } from "lucide-react";
import type { WelfareRequestRow } from "@/lib/api/welfare";
import { Avatar } from "@/components/dashboard/admin/people/peopleShared";
import { fmt, STATUS_STYLE } from "./shared";

/** Who asked and when, whether they are a worker, the status, and the delete button. */
export default function WelfareCardHeader({ r, onDelete }: { r: WelfareRequestRow; onDelete: () => void }) {
  const displayName = r.member ? `${r.member.firstName} ${r.member.lastName}` : r.fullName;
  const statusStyle = STATUS_STYLE[r.status];
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-3">
        {r.member ? (
          <Avatar firstName={r.member.firstName} lastName={r.member.lastName} photoUrl={r.member.photoUrl} size={36} />
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 text-gray-400">
            <UserRound size={16} />
          </span>
        )}
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-bold text-gray-900 dark:text-white">{displayName}</p>
            {r.member && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400" title="Signed in when submitted">
                <ShieldCheck size={9} /> Verified
              </span>
            )}
            <span className="rounded-full bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-gray-500 dark:text-white/50">
              {r.isWorkerInChurch ? "Worker" : "Not a worker"}
            </span>
          </div>
          <p className="text-[11px] text-gray-400">{fmt(r.submittedAt)}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${statusStyle.className}`}>
          {statusStyle.label}
        </span>
        <button
          type="button"
          onClick={onDelete}
          className="shrink-0 rounded-lg p-1.5 text-gray-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
          aria-label="Delete welfare request"
          title="Delete"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
