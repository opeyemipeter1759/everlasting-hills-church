"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderCog, GraduationCap, Plus, SearchX } from "lucide-react";
import CoursesAdminSkeleton from "@/components/ui/skeleton/CoursesAdminSkeleton";
import CourseAdminCard from "./CourseAdminCard";
import CourseStatsRow from "./CourseStatsRow";
import CourseFilterBar from "./CourseFilterBar";
import CategoryManagerModal from "./CategoryManagerModal";
import CategoryCard from "@/components/dashboard/courses/CategoryCard";
import { useCourses, useCourseCategories } from "@/lib/api/courses";

export default function CoursesAdminClient() {
  const router = useRouter();
  const { data: catalog = [], isLoading: coursesLoading } = useCourses();
  const { data: categories = [], isLoading: categoriesLoading } = useCourseCategories();
  const [query, setQuery] = useState("");
  const [managingCategories, setManagingCategories] = useState(false);

  const searching = query.trim().length > 0;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter((c) => !q || c.title.toLowerCase().includes(q) || c.category.name.toLowerCase().includes(q));
  }, [catalog, query]);

  const topLevelCategories = useMemo(() => {
    const children = new Map<string, number>();
    for (const cat of categories) {
      if (cat.parentId) children.set(cat.parentId, (children.get(cat.parentId) ?? 0) + 1);
    }
    return categories
      .filter((c) => !c.parentId)
      .map((c) => {
        const subcategoryCount = children.get(c.id) ?? 0;
        const descendantCourses = categories
          .filter((child) => child.parentId === c.id)
          .reduce((n, child) => n + child.courseCount, 0);
        return { ...c, subcategoryCount, totalCourseCount: c.courseCount + descendantCourses };
      });
  }, [categories]);

  if (coursesLoading || categoriesLoading) return <CoursesAdminSkeleton />;

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#e8768a] mb-1.5">
            Courses
          </p>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Manage Courses</h1>
          <p className="text-sm text-gray-500 dark:text-white/50 mt-1 max-w-xl">
            Browse the catalog by category, add new courses, set which course must be completed before another
            unlocks, and build each course's pass/fail exam.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setManagingCategories(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/80 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <FolderCog size={15} />
            Manage categories
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/admin/courses/new")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-colors"
          >
            <Plus size={15} />
            New Course
          </button>
        </div>
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

          {searching ? (
            filtered.length === 0 ? (
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
            )
          ) : topLevelCategories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-12 text-center">
              <FolderCog size={28} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No categories yet</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Create a category to start organizing the catalog.</p>
            </div>
          ) : (
            <div>
              <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/50">
                Categories
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {topLevelCategories.map((c) => (
                  <CategoryCard
                    key={c.id}
                    id={c.id}
                    name={c.name}
                    courseCount={c.totalCourseCount}
                    subcategoryCount={c.subcategoryCount}
                    href={`/dashboard/admin/courses/category/${c.id}`}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <CategoryManagerModal open={managingCategories} onClose={() => setManagingCategories(false)} />
    </div>
  );
}
