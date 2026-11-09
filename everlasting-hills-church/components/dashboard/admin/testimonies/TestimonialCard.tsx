import { CheckCircle2, Clock, Trash2 } from "lucide-react";
import type { AdminTestimonial } from "@/lib/api/testimonials";
import TestimonialAuthor from "./TestimonialAuthor";
import TestimonialActions from "./TestimonialActions";

/** One testimony: the author, its published state, the text, and the read/publish actions. */
export default function TestimonialCard({ t, canTogglePublish, onDelete }: { t: AdminTestimonial; canTogglePublish: boolean; onDelete: () => void }) {
  return (
    <div
      className={`rounded-2xl border bg-white dark:bg-[#161618] p-5 space-y-3 ${
        t.published ? "border-gray-200 dark:border-white/10" : "border-l-4 border-l-amber-400 border-gray-200 dark:border-l-amber-500 dark:border-white/10"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TestimonialAuthor t={t} />
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
              t.published
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
            }`}
          >
            {t.published ? <CheckCircle2 size={10} /> : <Clock size={10} />} {t.published ? "Published" : "Draft"}
          </span>
          <button
            type="button"
            onClick={onDelete}
            className="shrink-0 rounded-lg p-1.5 text-gray-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
            aria-label="Delete testimonial"
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <p className="whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-white/80">{t.content}</p>
      <TestimonialActions t={t} canTogglePublish={canTogglePublish} />
    </div>
  );
}
