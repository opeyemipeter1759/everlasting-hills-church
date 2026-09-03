"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, GraduationCap, Lock } from "lucide-react";
import ExploreCoursesSkeleton from "@/components/ui/skeleton/ExploreCoursesSkeleton";
import CourseCard from "./CourseCard";
import CategoryEnrollmentForm from "./CategoryEnrollmentForm";
import { useCourses, useCourseCategories, useMyCourseProgress, useMyCategoryEnrollments, getCourseStatus } from "@/lib/api/courses";

export default function ExploreCategoryClient({ categoryId }: { categoryId: string }) {
  const { data: catalog = [], isLoading: coursesLoading } = useCourses();
  const { data: categories = [], isLoading: categoriesLoading } = useCourseCategories();
  const { data: progress = {} } = useMyCourseProgress();
  const { data: enrolledCategoryIds = [] } = useMyCategoryEnrollments();
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const isEnrolledInCategory = enrolledCategoryIds.includes(categoryId);

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
      <div className="max-w-full space-y-4">
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
        {category.description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-white/60">
            {category.description}
          </p>
        )}
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
        <>
          {!isEnrolledInCategory && (
            <div className="flex flex-col items-start gap-3 rounded-2xl border border-[#87102C]/20 bg-[#87102C]/5 dark:bg-[#87102C]/10 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#87102C]/10 text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#e8768a]">
                  <Lock size={18} />
                </span>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Enroll in {category.name} to get started</p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-white/50">
                    A quick form is required before you can take courses in this category.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEnrollForm(true)}
                className="w-full flex-shrink-0 rounded-xl bg-[#87102C] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#6E0C24] sm:w-auto"
              >
                Enroll in this Category
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const status = getCourseStatus(course, catalog, progress, enrolledCategoryIds);
              const prerequisite = catalog.find((c) => c.slug === course.prerequisiteSlug);
              return (
                <CourseCard key={course.id} course={course} status={status} prerequisiteTitle={prerequisite?.title} />
              );
            })}
          </div>
        </>
      )}

      <CategoryEnrollmentForm
        open={showEnrollForm}
        onClose={() => setShowEnrollForm(false)}
        categoryId={categoryId}
        categoryName={category.name}
      />
    </div>
  );
}
