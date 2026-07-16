import { Clock, Layers, Loader2, Lock, PlayCircle } from "lucide-react";
import { ICON_OPTIONS } from "@/lib/courses-data";

export default function CourseEditorPreview({
  title,
  tagline,
  category,
  duration,
  lessonsCount,
  iconKey,
  gradient,
  questionCount,
  prerequisiteTitle,
  mode,
  progress,
  canSave,
  saving,
  onSave,
  onCancel,
}: {
  title: string;
  tagline: string;
  category: string;
  duration: string;
  lessonsCount: number;
  iconKey: string;
  gradient: [string, string];
  questionCount: number;
  prerequisiteTitle: string | null;
  mode: "create" | "edit";
  progress: { done: number; total: number };
  canSave: boolean;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  const Icon = ICON_OPTIONS[iconKey] ?? ICON_OPTIONS.BookOpen;
  const pct = progress.total === 0 ? 0 : Math.round((progress.done / progress.total) * 100);

  return (
    <div className="space-y-4 lg:sticky lg:top-6">
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-4">
        <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-white/50">
          <span>Ready to publish</span>
          <span className="tabular-nums text-gray-900 dark:text-white">{progress.done}/{progress.total}</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
          <div className="h-full rounded-full bg-[#87102C] transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] shadow-sm">
        <div
          className="relative flex h-32 items-center justify-center overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}
        >
          <div aria-hidden="true" className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
          <div aria-hidden="true" className="absolute -bottom-8 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
          <Icon size={38} className="relative text-white/85" strokeWidth={1.5} />
        </div>

        <div className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#87102C] dark:text-[#e8768a]">
            {category || "Category"}
          </p>
          <h3 className="mt-1 text-base font-bold text-gray-900 dark:text-white">{title || "Course title"}</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-white/50 line-clamp-2">{tagline || "Tagline preview"}</p>

          <div className="mt-3 flex items-center gap-3 border-t border-gray-100 dark:border-white/[0.06] pt-3 text-xs text-gray-400 dark:text-white/40">
            <span className="inline-flex items-center gap-1.5">
              <Clock size={12} /> {duration || "—"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <PlayCircle size={12} /> {lessonsCount} lessons
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-4 text-sm">
        <div className="flex items-center justify-between text-gray-500 dark:text-white/50">
          <span className="inline-flex items-center gap-1.5">
            <Layers size={13} /> Exam
          </span>
          <span className="font-semibold text-gray-900 dark:text-white">{questionCount} questions</span>
        </div>
        <div className="flex items-center justify-between text-gray-500 dark:text-white/50">
          <span className="inline-flex items-center gap-1.5">
            <Lock size={13} /> Prerequisite
          </span>
          <span className="font-semibold text-gray-900 dark:text-white">{prerequisiteTitle ?? "None"}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#87102C] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#6E0C24] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? "Saving…" : mode === "create" ? "Create Course" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
