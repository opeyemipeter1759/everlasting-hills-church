"use client";

import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { fieldCls } from "@/components/ui/overlay/FormModal";
import type { CourseLesson, CourseModule } from "@/lib/api/courses";

function emptyLesson(): CourseLesson {
  // Client-only placeholder id, just for a stable React key — the backend always
  // assigns its own id on save and ignores whatever id (if any) is sent in.
  return { id: `l-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title: "", duration: "", videoUrl: null };
}

function emptyModule(): CourseModule {
  return { title: "", lessons: [emptyLesson()] };
}

export default function CurriculumEditor({
  curriculum,
  onChange,
}: {
  curriculum: CourseModule[];
  onChange: (curriculum: CourseModule[]) => void;
}) {
  function updateModule(i: number, patch: Partial<CourseModule>) {
    onChange(curriculum.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  }

  function updateLesson(mi: number, li: number, patch: Partial<CourseLesson>) {
    onChange(
      curriculum.map((m, idx) =>
        idx === mi ? { ...m, lessons: m.lessons.map((l, lidx) => (lidx === li ? { ...l, ...patch } : l)) } : m,
      ),
    );
  }

  // Only lessons with an actual title survive to the saved course — count those, not
  // every blank row, so this number matches what will really be on the course.
  const filledLessonCount = curriculum.reduce((n, m) => n + m.lessons.filter((l) => l.title.trim()).length, 0);
  const hasEmptyRows = curriculum.length > 0 && filledLessonCount === 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
          Curriculum ({filledLessonCount} lessons)
        </label>
        <button
          type="button"
          onClick={() => onChange([...curriculum, emptyModule()])}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#87102C] hover:text-[#6E0C24] dark:text-[#e8768a]"
        >
          <Plus size={13} /> Add module
        </button>
      </div>

      {hasEmptyRows && (
        <div className="mb-3 flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
          <span>Every lesson below is missing a title, so none of them will be saved. Fill in at least one lesson title.</span>
        </div>
      )}

      <div className="space-y-4">
        {curriculum.map((mod, mi) => (
          <div key={mi} className="rounded-xl border border-gray-200 dark:border-white/10 p-4">
            <div className="mb-2.5 flex items-start gap-2">
              <input
                value={mod.title}
                onChange={(e) => updateModule(mi, { title: e.target.value })}
                placeholder={`Module ${mi + 1} title (required) — e.g. Week 1 — Who Is God?`}
                className={`${fieldCls} flex-1`}
              />
              <button
                type="button"
                onClick={() => onChange(curriculum.filter((_, idx) => idx !== mi))}
                className="flex-shrink-0 rounded-lg p-2.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>

            <div className="space-y-2">
              {mod.lessons.map((lesson, li) => (
                <div key={li} className="space-y-1.5 rounded-lg bg-gray-50 dark:bg-white/[0.03] p-2.5">
                  <div className="flex items-center gap-2">
                    <input
                      value={lesson.title}
                      onChange={(e) => updateLesson(mi, li, { title: e.target.value })}
                      placeholder="Lesson title"
                      className={`${fieldCls} flex-1 w-full py-2 text-sm`}
                    />
                    <input
                      value={lesson.duration}
                      onChange={(e) => updateLesson(mi, li, { duration: e.target.value })}
                      placeholder="18 min"
                      className={`${fieldCls} flex-1 w-full py-2 text-sm`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateModule(mi, { lessons: mod.lessons.filter((_, lidx) => lidx !== li) })
                      }
                      className="flex-shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <input
                    value={lesson.videoUrl ?? ""}
                    onChange={(e) => updateLesson(mi, li, { videoUrl: e.target.value })}
                    placeholder="YouTube link — https://youtube.com/watch?v=…"
                    className={`${fieldCls} py-2 text-sm`}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => updateModule(mi, { lessons: [...mod.lessons, emptyLesson()] })}
                className="inline-flex items-center gap-1.5 pt-1 text-xs font-semibold text-gray-400 hover:text-[#87102C] dark:hover:text-[#e8768a]"
              >
                <Plus size={12} /> Add lesson
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
