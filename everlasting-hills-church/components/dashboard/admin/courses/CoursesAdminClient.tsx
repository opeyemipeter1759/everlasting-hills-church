"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Plus, SearchX } from "lucide-react";
import CoursesAdminSkeleton from "@/components/ui/skeleton/CoursesAdminSkeleton";
import CourseAdminCard from "./CourseAdminCard";
import CourseStatsRow from "./CourseStatsRow";
import CourseFilterBar from "./CourseFilterBar";
import { useCourses } from "@/lib/api/courses";

export default function CoursesAdminClient() {
  const router = useRouter();
  const { data: catalog = [], isLoading } = useCourses();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter((c) => !q || c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
  }, [catalog, query]);

  if (isLoading) return <CoursesAdminSkeleton />;

  return (
    <div className="max-w-6xl space-y-6">
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

      {catalog.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-12 text-center">
          <GraduationCap size={28} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No courses in the catalog yet</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Create your first course to get started.</p>
        </div>
      ) : (
        <>
          <CourseStatsRow catalog={catalog} />

          <CourseFilterBar query={query} onQueryChange={setQuery} />

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-12 text-center">
              <SearchX size={28} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No courses match your search</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Try a different keyword.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((course) => {
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
        </>
      )}
    </div>
  );
}
