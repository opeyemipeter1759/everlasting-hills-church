import { Clock, Layers, Lock, PlayCircle } from "lucide-react";
import { ICON_OPTIONS } from "@/lib/courses-data";
import { LEVEL_LABEL, type CourseLevel } from "@/lib/api/courses";

const LEVEL_BADGE: Record<CourseLevel, string> = {
  BEGINNER: "bg-emerald-500/15 text-emerald-100",
  INTERMEDIATE: "bg-amber-500/15 text-amber-100",
  ADVANCED: "bg-rose-500/15 text-rose-100",
};

export default function CourseEditorPreview({
  title,
  tagline,
  category,
  level,
  duration,
  lessonsCount,
  iconKey,
  gradient,
  questionCount,
  prerequisiteTitle,
  mode,
  canSave,
  onSave,
  onCancel,
}: {
  title: string;
  tagline: string;
  category: string;
  level: CourseLevel;
  duration: string;
  lessonsCount: number;
  iconKey: string;
  gradient: [string, string];
  questionCount: number;
  prerequisiteTitle: string | null;
  mode: "create" | "edit";
  canSave: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  const Icon = ICON_OPTIONS[iconKey] ?? ICON_OPTIONS.BookOpen;

  return (
    <div className="space-y-4 lg:sticky lg:top-6">
      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618]">
        <div
          className="relative flex h-32 items-center justify-center overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}
        >
          <div aria-hidden="true" className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
          <Icon size={38} className="relative text-white/85" strokeWidth={1.5} />
          <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${LEVEL_BADGE[level]}`}>
            {LEVEL_LABEL[level]}
          </span>
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
          className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className="flex-1 rounded-xl bg-[#87102C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6E0C24] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mode === "create" ? "Create Course" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
