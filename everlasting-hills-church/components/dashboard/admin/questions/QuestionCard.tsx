import { CheckCircle2, Mail, Phone } from "lucide-react";
import { useUpdateQuestionStatus, type QuestionRow } from "@/lib/api/questions";
import { showToast } from "@/components/ui/toast/toast";
import { errorMessage } from "./shared";
import QuestionCardHeader from "./QuestionCardHeader";

/** One question: who asked, what they asked, how to reach them, and the answered toggle. */
export default function QuestionCard({ r, onDelete }: { r: QuestionRow; onDelete: () => void }) {
  const updateStatus = useUpdateQuestionStatus();
  const email = r.member?.email ?? (r.isAnonymous ? null : r.email);
  const phone = r.member?.phone ?? (r.isAnonymous ? null : r.phone);
  const answered = r.status === "ANSWERED";

  async function toggleStatus() {
    try {
      await updateStatus.mutateAsync({ id: r.id, status: answered ? "PENDING" : "ANSWERED" });
      showToast.success(answered ? "Marked pending" : "Marked answered");
    } catch (err) {
      showToast.error(errorMessage(err, "Couldn't update status"));
    }
  }

  return (
    <div
      className={`rounded-2xl border bg-white dark:bg-[#161618] p-5 space-y-3 ${
        answered ? "border-gray-200 dark:border-white/10" : "border-l-4 border-l-amber-400 border-gray-200 dark:border-l-amber-500 dark:border-white/10"
      }`}
    >
      <QuestionCardHeader r={r} onDelete={onDelete} />
      <p className="whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-white/80">{r.question}</p>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 dark:border-white/[0.06] pt-3">
        {(email || phone) ? (
          <div className="flex flex-wrap items-center gap-4 text-[12px] text-gray-500 dark:text-white/50">
            {email && <span className="inline-flex items-center gap-1.5"><Mail size={12} /> {email}</span>}
            {phone && <span className="inline-flex items-center gap-1.5"><Phone size={12} /> {phone}</span>}
          </div>
        ) : <span />}
        <button
          type="button"
          onClick={toggleStatus}
          disabled={updateStatus.isPending}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 ${
            answered
              ? "border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          }`}
        >
          <CheckCircle2 size={13} /> {answered ? "Mark as pending" : "Mark answered"}
        </button>
      </div>
    </div>
  );
}
