"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GraduationCap, Plus } from "lucide-react";
import CoursesAdminSkeleton from "@/components/ui/skeleton/CoursesAdminSkeleton";
import CourseAdminCard from "./CourseAdminCard";
import { useCourses, useCourseCategories } from "@/lib/api/courses";

export default function CourseCategoryAdminClient({ categoryId }: { categoryId: string }) {
  const router = useRouter();
  const { data: catalog = [], isLoading: coursesLoading } = useCourses();
  const { data: categories = [], isLoading: categoriesLoading } = useCourseCategories();

  const category = categories.find((c) => c.id === categoryId);
  const parent = category?.parentId ? categories.find((c) => c.id === category.parentId) : null;
  const subcategories = useMemo(() => categories.filter((c) => c.parentId === categoryId), [categories, categoryId]);

  const courses = useMemo(
    () => catalog.filter((c) => c.category.id === categoryId || c.category.parentId === categoryId),
    [catalog, categoryId],
  );

  if (coursesLoading || categoriesLoading) return <CoursesAdminSkeleton />;

  if (!category) {
    return (
      <div className="max-w-6xl space-y-4">
        <Link href="/dashboard/admin/courses" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
          <ArrowLeft size={14} /> Courses
        </Link>
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-12 text-center">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Category not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#e8768a]">
            <Link href="/dashboard/admin/courses" className="hover:underline">Courses</Link>
            {parent && (
              <>
                <span>/</span>
                <Link href={`/dashboard/admin/courses/category/${parent.id}`} className="hover:underline">{parent.name}</Link>
              </>
            )}
            <span>/</span>
            <span>{category.name}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{category.name}</h1>
          <p className="text-sm text-gray-500 dark:text-white/50 mt-1">
            {courses.length} course{courses.length === 1 ? "" : "s"}
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

      {subcategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {subcategories.map((sc) => (
            <Link
              key={sc.id}
              href={`/dashboard/admin/courses/category/${sc.id}`}
              className="rounded-full border border-[#E7CDD3] dark:border-white/10 bg-white dark:bg-white/5 px-3.5 py-1.5 text-xs font-bold text-gray-600 dark:text-white/60 hover:border-[#87102C]/40 hover:text-[#87102C] dark:hover:text-[#e8768a] transition-colors"
            >
              {sc.name} · {sc.courseCount}
            </Link>
          ))}
        </div>
      )}

      {courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-12 text-center">
          <GraduationCap size={28} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No courses in this category yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const prerequisite = catalog.find((c) => c.id === course.prerequisiteId);
            return (
              <CourseAdminCard
                key={course.id}
                course={course}
                prerequisiteTitle={prerequisite?.title}
                onClick={() => router.push(`/dashboard/admin/courses/${course.id}`)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
