import { CheckCircle2, Clock, ShieldCheck, Trash2, UserRound } from "lucide-react";
import type { QuestionRow } from "@/lib/api/questions";
import { Avatar } from "@/components/dashboard/admin/people/peopleShared";
import { fmt, submitterName } from "./shared";

/** Who asked and when, the question's status, and the delete button. */
export default function QuestionCardHeader({ r, onDelete }: { r: QuestionRow; onDelete: () => void }) {
  const answered = r.status === "ANSWERED";
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
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-gray-900 dark:text-white">{submitterName(r)}</p>
            {r.member && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400" title="Signed in when submitted">
                <ShieldCheck size={9} /> Verified
              </span>
            )}
            {r.isAnonymous && (
              <span className="rounded-full bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-gray-500 dark:text-white/50">
                Anonymous
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400">{fmt(r.submittedAt)}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
            answered
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
              : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
          }`}
        >
          {answered ? <CheckCircle2 size={10} /> : <Clock size={10} />} {answered ? "Answered" : "Pending"}
        </span>
        <button
          type="button"
          onClick={onDelete}
          className="shrink-0 rounded-lg p-1.5 text-gray-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
          aria-label="Delete question"
          title="Delete"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
