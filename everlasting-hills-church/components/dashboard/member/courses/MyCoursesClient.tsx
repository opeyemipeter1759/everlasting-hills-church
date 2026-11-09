"use client";

import Link from "next/link";
import { Award, Compass, Gauge, GraduationCap, PlayCircle, TrendingUp } from "lucide-react";
import { useCourses, useMyCourseProgress, useMyCategoryEnrollments } from "@/lib/api/courses";
import MyCoursesSkeleton from "@/components/ui/skeleton/MyCoursesSkeleton";
import { BentoStat } from "./my-courses/BentoStat";
import { CourseSection } from "./my-courses/CourseSection";
import { AllCaughtUpTile, NoCoursesYet } from "./my-courses/EmptyStates";
import { FeaturedTile } from "./my-courses/FeaturedTile";
import { progressPctFor, summarizeCourses } from "./my-courses/course-summary";

/** The member's own courses: where to pick up, their totals, then in-progress and completed. */
export default function MyCoursesClient() {
  const { data: catalog = [], isLoading: catalogLoading } = useCourses();
  const { data: progress = {}, isLoading: progressLoading } = useMyCourseProgress();
  const { data: enrolledCategoryIds = [] } = useMyCategoryEnrollments();

  if (catalogLoading || progressLoading) return <MyCoursesSkeleton />;

  const { enrolled, inProgress, completed, featured, restInProgress, avgProgress } = summarizeCourses(catalog, progress);
  const section = { catalog, progress, enrolledCategoryIds };

  return (
    <div className="max-w-full space-y-7 sm:space-y-9">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="mt-1.5 h-9 w-1 flex-shrink-0 rounded-full bg-[#87102C]" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] xs:tracking-[0.2em] text-[#87102C] dark:text-[#e8768a]">My Courses</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">Continue learning</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-white/50">Watch lessons and take exams for courses you've enrolled in.</p>
          </div>
        </div>
        {enrolled.length > 0 && (
          <Link
            href="/dashboard/explore-courses"
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-gray-200 dark:border-white/10 px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <Compass size={15} /> Explore more courses
          </Link>
        )}
      </div>

      {enrolled.length === 0 ? (
        <NoCoursesYet />
      ) : (
        <>
          {/* Bento block: hero tile fills a 2x2 corner, four single-cell stats pack the rest via dense flow. */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-flow-row-dense lg:grid-cols-4">
            {featured ? (
              <FeaturedTile course={featured} pct={progressPctFor(featured, progress)} className="col-span-2 row-span-2" />
            ) : (
              <AllCaughtUpTile className="col-span-2 row-span-2" />
            )}
            <BentoStat tone="neutral" icon={<GraduationCap size={17} />} label="Enrolled" value={enrolled.length} />
            <BentoStat tone="amber" icon={<TrendingUp size={17} />} label="In progress" value={inProgress.length} />
            <BentoStat tone="emerald" icon={<Award size={17} />} label="Completed" value={completed.length} />
            <BentoStat tone="brand" icon={<Gauge size={17} />} label="Avg. progress" value={`${avgProgress}%`} />
          </div>

          <CourseSection icon={PlayCircle} label="In Progress" tone="amber" courses={restInProgress} showProgress {...section} />
          <CourseSection icon={Award} label="Completed" tone="emerald" courses={completed} {...section} />
        </>
      )}
    </div>
  );
}
