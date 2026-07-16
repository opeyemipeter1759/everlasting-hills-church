"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, CheckCircle2, Clock, GraduationCap, Lock, Pencil, PlayCircle, Trash2, Users } from "lucide-react";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import CourseAdminDetailSkeleton from "@/components/ui/skeleton/CourseAdminDetailSkeleton";
import CourseCurriculum from "@/components/dashboard/member/courses/CourseCurriculum";
import { ICON_OPTIONS } from "@/lib/courses-data";
import { useCourseAdmin, useCourses, useDeleteCourse } from "@/lib/api/courses";

export default function CourseAdminDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { data: course, isLoading } = useCourseAdmin(id);
  const { data: catalog = [] } = useCourses();
  const deleteCourse = useDeleteCourse();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (isLoading) return <CourseAdminDetailSkeleton />;

  if (!course) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <GraduationCap size={28} className="text-gray-300 dark:text-gray-700" />
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">This course couldn't be found.</p>
        <button
          type="button"
          onClick={() => router.push("/dashboard/admin/courses")}
          className="text-sm font-semibold text-[#87102C] hover:underline dark:text-[#e8768a]"
        >
          ← Back to Courses
        </button>
      </div>
    );
  }

  const listItem = catalog.find((c) => c.id === course.id);
  const prerequisite = catalog.find((c) => c.id === course.prerequisiteId);
  const Icon = ICON_OPTIONS[course.iconKey] ?? ICON_OPTIONS.BookOpen;
  const [from, to] = course.gradient;

  return (
    <div className="max-w-3xl space-y-5">
      <button
        type="button"
        onClick={() => router.push("/dashboard/admin/courses")}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        <ArrowLeft size={14} /> Courses
      </button>

      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618]">
        <div
          className="relative flex h-32 items-center justify-center overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
        >
          <div aria-hidden="true" className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
          <div aria-hidden="true" className="absolute -bottom-8 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
          <Icon size={40} className="relative text-white/85" strokeWidth={1.5} />
        </div>

        <div className="space-y-5 p-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#87102C] dark:text-[#e8768a]">
              {course.category}
            </p>
            <h1 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{course.title}</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-white/50">{course.tagline}</p>
          </div>

          <p className="text-sm leading-relaxed text-gray-600 dark:text-white/60">{course.description}</p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-white/50">
            <span className="inline-flex items-center gap-1.5">
              <Clock size={13} /> {course.duration}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <PlayCircle size={13} /> {listItem?.lessonsCount ?? 0} lesson{listItem?.lessonsCount === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users size={13} /> {listItem?.studentsCount ?? 0} student{listItem?.studentsCount === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap size={13} /> {course.exam.length} exam question{course.exam.length === 1 ? "" : "s"}
            </span>
          </div>

          {prerequisite && (
            <p className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <Lock size={12} /> Requires "{prerequisite.title}" to be completed first
            </p>
          )}

          {course.outcomes.length > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-white/50">
                What members will learn
              </h2>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {course.outcomes.map((o) => (
                  <li key={o} className="flex items-start gap-2 text-sm text-gray-600 dark:text-white/60">
                    <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0 text-emerald-500" />
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h2 className="mb-2 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-white/50">
              Curriculum
            </h2>
            <CourseCurriculum modules={course.curriculum} interactive={false} />
          </div>

          <div className="flex items-center gap-2 border-t border-gray-100 dark:border-white/10 pt-5">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/admin/courses/${course.id}/edit`)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#87102C] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#6E0C24] transition-colors"
            >
              <Pencil size={14} /> Edit course
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-white/10 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        tone="danger"
        title="Delete course?"
        description={
          <>
            This permanently removes <span className="font-semibold">{course.title}</span> from the catalog. Any
            course that requires it as a prerequisite will need a new one set.
          </>
        }
        confirmLabel="Delete course"
        loading={deleteCourse.isPending}
        onConfirm={() => {
          deleteCourse.mutate(course.id, {
            onSuccess: () => {
              toast.success(`"${course.title}" deleted`);
              router.push("/dashboard/admin/courses");
            },
            onError: (err) => toast.error((err as Error).message || "Couldn't delete — try again"),
          });
        }}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
