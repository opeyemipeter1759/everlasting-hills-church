"use client";

import Link from "next/link";
import { Compass, GraduationCap } from "lucide-react";
import { useCourses, useMyCourseProgress, getCourseStatus } from "@/lib/api/courses";
import MyCoursesSkeleton from "@/components/ui/skeleton/MyCoursesSkeleton";
import CourseCard from "./CourseCard";

export default function MyCoursesClient() {
  const { data: catalog = [], isLoading: catalogLoading } = useCourses();
  const { data: progress = {}, isLoading: progressLoading } = useMyCourseProgress();

  if (catalogLoading || progressLoading) return <MyCoursesSkeleton />;

  const enrolled = catalog.filter((c) => progress[c.id]?.enrolled);
  const inProgress = enrolled.filter((c) => !progress[c.id]?.completed);
  const completed = enrolled.filter((c) => progress[c.id]?.completed);

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#e8768a]">
          My Courses
        </p>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Continue learning</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-white/50">
          Watch lessons and take exams for courses you've enrolled in.
        </p>
      </div>

      {enrolled.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-12 text-center">
          <GraduationCap size={28} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">You haven't enrolled in any courses yet</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Explore the catalog to find one that fits your season.</p>
          <Link
            href="/dashboard/explore-courses"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6E0C24] transition-colors"
          >
            <Compass size={15} /> Explore Courses
          </Link>
        </div>
      ) : (
        <>
          {inProgress.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/50">
                In Progress ({inProgress.length})
              </h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {inProgress.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    status={getCourseStatus(course, catalog, progress)}
                    href={`/dashboard/courses/${course.slug}`}
                  />
                ))}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/50">
                Completed ({completed.length})
              </h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {completed.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    status={getCourseStatus(course, catalog, progress)}
                    href={`/dashboard/courses/${course.slug}`}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
