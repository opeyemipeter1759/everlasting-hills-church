"use client";

import { useMemo, useState } from "react";
import { GraduationCap, SearchX } from "lucide-react";
import { useCourses, useCourseCategories, useMyCourseProgress, getCourseStatus } from "@/lib/api/courses";
import ExploreCoursesSkeleton from "@/components/ui/skeleton/ExploreCoursesSkeleton";
import ExploreCoursesHero from "./ExploreCoursesHero";
import CourseFilters from "./CourseFilters";
import CourseCard from "./CourseCard";
import CategoryCard from "@/components/dashboard/courses/CategoryCard";

export default function ExploreCoursesClient() {
  const [search, setSearch] = useState("");
  const { data: catalog = [], isLoading: coursesLoading } = useCourses();
  const { data: categories = [], isLoading: categoriesLoading } = useCourseCategories();
  const { data: progress = {} } = useMyCourseProgress();

  const searching = search.trim().length > 0;
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalog.filter((c) => !q || c.title.toLowerCase().includes(q) || c.tagline.toLowerCase().includes(q));
  }, [catalog, search]);

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
      })
      .filter((c) => c.totalCourseCount > 0);
  }, [categories]);

  const totalStudents = useMemo(() => catalog.reduce((sum, c) => sum + c.studentsCount, 0), [catalog]);

  if (coursesLoading || categoriesLoading) return <ExploreCoursesSkeleton />;

  return (
    <div className="max-w-6xl space-y-6">
      <ExploreCoursesHero courseCount={catalog.length} categoryCount={categories.length} studentCount={totalStudents} />

      <CourseFilters search={search} onSearchChange={setSearch} />

      {searching ? (
        filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-12 text-center">
            <SearchX size={28} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No courses match your search</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Try a different keyword.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course) => {
              const status = getCourseStatus(course, catalog, progress);
              const prerequisite = catalog.find((c) => c.slug === course.prerequisiteSlug);
              return (
                <CourseCard key={course.id} course={course} status={status} prerequisiteTitle={prerequisite?.title} />
              );
            })}
          </div>
        )
      ) : catalog.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-12 text-center">
          <GraduationCap size={28} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No courses yet</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Check back soon — new courses are on the way.</p>
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
                href={`/dashboard/explore-courses/category/${c.id}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
