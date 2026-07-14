"use client";

import { useMemo, useState } from "react";
import { GraduationCap } from "lucide-react";
import { getCatalog, getCourseCategories } from "@/lib/courses-catalog";
import { getCourseStatus } from "@/lib/courses-store";
import { useCourseProgress } from "@/hooks";
import ExploreCoursesHero from "./ExploreCoursesHero";
import CourseFilters from "./CourseFilters";
import CourseCard from "./CourseCard";

export default function ExploreCoursesClient() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const { progress } = useCourseProgress();
  const catalog = useMemo(getCatalog, []);
  const categories = useMemo(() => getCourseCategories(catalog), [catalog]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalog.filter((c) => {
      const matchesCategory = category === "All" || c.category === category;
      const matchesSearch = !q || c.title.toLowerCase().includes(q) || c.tagline.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [catalog, search, category]);

  const totalStudents = useMemo(() => catalog.reduce((sum, c) => sum + c.studentsCount, 0), [catalog]);

  return (
    <div className="max-w-6xl space-y-6">
      <ExploreCoursesHero courseCount={catalog.length} categoryCount={categories.length} studentCount={totalStudents} />

      <CourseFilters
        search={search}
        onSearchChange={setSearch}
        categories={categories}
        activeCategory={category}
        onCategoryChange={setCategory}
      />

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-12 text-center">
          <GraduationCap size={28} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No courses match your search</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Try a different keyword or category.</p>
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
      )}
    </div>
  );
}
