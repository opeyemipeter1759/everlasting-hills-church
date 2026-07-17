import { CheckCircle2, EyeOff, Pencil, Trash2 } from "lucide-react";
import type { Testimonial } from "./types";

export default function TestimonialRow({
  testimonial: t,
  onTogglePublish,
  onEdit,
  onDelete,
}: {
  testimonial: Testimonial;
  onTogglePublish: (t: Testimonial) => void;
  onEdit: (t: Testimonial) => void;
  onDelete: (t: Testimonial) => void;
}) {
  return (
    <li className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {t.authorPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={t.authorPhotoUrl}
              alt=""
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <span className="w-10 h-10 rounded-full bg-[#87102C]/10 dark:bg-[#87102C]/20 text-[#87102C] dark:text-[#e8768a] flex items-center justify-center text-sm font-bold flex-shrink-0">
              {t.authorName[0]?.toUpperCase() ?? "?"}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-gray-900 dark:text-white">{t.authorName}</p>
              {t.published ? (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                  Published
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400">
                  Draft
                </span>
              )}
            </div>
            {t.authorRole && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.authorRole}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => onTogglePublish(t)}
            title={t.published ? "Unpublish" : "Publish"}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            {t.published ? <EyeOff size={15} /> : <CheckCircle2 size={15} />}
          </button>
          <button
            type="button"
            onClick={() => onEdit(t)}
            title="Edit"
            className="p-2 rounded-lg text-gray-400 hover:text-[#87102C] hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(t)}
            title="Delete"
            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <blockquote className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed border-l-2 border-[#87102C]/20 pl-4">
        {t.content}
      </blockquote>
    </li>
  );
}
