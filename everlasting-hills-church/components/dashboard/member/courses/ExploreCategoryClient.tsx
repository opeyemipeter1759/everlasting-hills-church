"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";
import ExploreCoursesSkeleton from "@/components/ui/skeleton/ExploreCoursesSkeleton";
import CourseCard from "./CourseCard";
import { useCourses, useCourseCategories, useMyCourseProgress, getCourseStatus } from "@/lib/api/courses";

export default function ExploreCategoryClient({ categoryId }: { categoryId: string }) {
  const { data: catalog = [], isLoading: coursesLoading } = useCourses();
  const { data: categories = [], isLoading: categoriesLoading } = useCourseCategories();
  const { data: progress = {} } = useMyCourseProgress();

  const category = categories.find((c) => c.id === categoryId);
  const parent = category?.parentId ? categories.find((c) => c.id === category.parentId) : null;
  const subcategories = useMemo(
    () => categories.filter((c) => c.parentId === categoryId && c.courseCount > 0),
    [categories, categoryId],
  );

  const courses = useMemo(
    () => catalog.filter((c) => c.category.id === categoryId || c.category.parentId === categoryId),
    [catalog, categoryId],
  );

  if (coursesLoading || categoriesLoading) return <ExploreCoursesSkeleton />;

  if (!category) {
    return (
      <div className="max-w-6xl space-y-4">
        <Link href="/dashboard/explore-courses" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
          <ArrowLeft size={14} /> Explore Courses
        </Link>
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-12 text-center">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Category not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#e8768a]">
          <Link href="/dashboard/explore-courses" className="hover:underline">Explore Courses</Link>
          {parent && (
            <>
              <span>/</span>
              <Link href={`/dashboard/explore-courses/category/${parent.id}`} className="hover:underline">{parent.name}</Link>
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

      {subcategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {subcategories.map((sc) => (
            <Link
              key={sc.id}
              href={`/dashboard/explore-courses/category/${sc.id}`}
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const status = getCourseStatus(course, catalog, progress);
            const prerequisite = catalog.find((c) => c.slug === course.prerequisiteSlug);
            return (
              <CourseCard key={course.id} course={course} status={status} prerequisiteTitle={prerequisite?.title} />
            );
          })}
        </div>
      )}
    </div>
  );
}
