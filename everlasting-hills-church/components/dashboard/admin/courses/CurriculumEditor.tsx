"use client";

import { Plus, Trash2 } from "lucide-react";
import { fieldCls } from "@/components/ui/overlay/FormModal";
import type { CourseLesson, CourseModule } from "@/lib/courses-data";

function emptyModule(): CourseModule {
  return { title: "", lessons: [{ title: "", duration: "" }] };
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

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
          Curriculum ({curriculum.reduce((n, m) => n + m.lessons.length, 0)} lessons)
        </label>
        <button
          type="button"
          onClick={() => onChange([...curriculum, emptyModule()])}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#87102C] hover:text-[#6E0C24] dark:text-[#e8768a]"
        >
          <Plus size={13} /> Add module
        </button>
      </div>

      <div className="space-y-4">
        {curriculum.map((mod, mi) => (
          <div key={mi} className="rounded-xl border border-gray-200 dark:border-white/10 p-4">
            <div className="mb-2.5 flex items-start gap-2">
              <input
                value={mod.title}
                onChange={(e) => updateModule(mi, { title: e.target.value })}
                placeholder={`Module ${mi + 1} title, e.g. Week 1 — Who Is God?`}
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
                      className={`${fieldCls} flex-1 py-2 text-sm`}
                    />
                    <input
                      value={lesson.duration}
                      onChange={(e) => updateLesson(mi, li, { duration: e.target.value })}
                      placeholder="18 min"
                      className={`${fieldCls} w-24 py-2 text-sm`}
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
                onClick={() => updateModule(mi, { lessons: [...mod.lessons, { title: "", duration: "" }] })}
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
