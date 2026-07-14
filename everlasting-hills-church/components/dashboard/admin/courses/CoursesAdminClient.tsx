"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { deleteCustomCourse, getCatalog, isCustomCourse } from "@/lib/courses-catalog";
import type { Course } from "@/lib/courses-data";

export default function CoursesAdminClient() {
  const router = useRouter();
  const [version, setVersion] = useState(0); // bumped after a delete to force a re-read of the catalog
  const catalog = useMemo(getCatalog, [version]);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#e8768a] mb-1.5">
            Courses
          </p>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Manage Courses</h1>
          <p className="text-sm text-gray-500 dark:text-white/50 mt-1 max-w-xl">
            Add new courses, set which course must be completed before another unlocks, and build each course's
            pass/fail exam. Members must score 100% to complete a course and unlock what comes next.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/dashboard/admin/courses/new")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-colors"
        >
          <Plus size={15} />
          New Course
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] overflow-hidden">
        <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
          {catalog.map((course) => {
            const prerequisite = catalog.find((c) => c.slug === course.prerequisiteSlug);
            const Icon = course.icon;
            return (
              <li key={course.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white"
                    style={{ background: `linear-gradient(135deg, ${course.gradient[0]}, ${course.gradient[1]})` }}
                  >
                    <Icon size={17} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{course.title}</p>
                    <p className="flex flex-wrap items-center gap-x-1.5 text-[11px] text-gray-400 dark:text-white/40">
                      {course.category} · {course.exam.length} question{course.exam.length === 1 ? "" : "s"}
                      {prerequisite && (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <Lock size={10} /> requires {prerequisite.title}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => router.push(`/dashboard/admin/courses/${course.id}`)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  {isCustomCourse(course.id) && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(course)}
                      title="Delete course"
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {catalog.length === 0 && (
          <div className="p-12 text-center">
            <GraduationCap size={28} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
            <p className="text-sm text-gray-400 dark:text-gray-500">No courses in the catalog yet.</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        tone="danger"
        title="Delete course?"
        description={
          <>
            This permanently removes <span className="font-semibold">{deleteTarget?.title}</span> from the catalog.
            Any course that requires it as a prerequisite will need a new one set.
          </>
        }
        confirmLabel="Delete course"
        onConfirm={() => {
          if (deleteTarget) {
            deleteCustomCourse(deleteTarget.id);
            setVersion((v) => v + 1);
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
