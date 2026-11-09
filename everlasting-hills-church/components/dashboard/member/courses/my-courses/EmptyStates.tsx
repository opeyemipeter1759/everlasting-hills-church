import Link from "next/link";
import { Award, Compass, GraduationCap } from "lucide-react";

/** Every enrolled course is finished: the hero tile invites them to another. */
export function AllCaughtUpTile({ className }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 rounded-2xl bg-emerald-600 p-6 text-center text-white ${className ?? ""}`}>
      <Award size={30} />
      <p className="text-lg font-bold">You're all caught up!</p>
      <p className="max-w-xs text-sm text-white/80">Every enrolled course is completed — ready for another?</p>
      <Link
        href="/dashboard/explore-courses"
        className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-4 py-2 text-sm font-bold backdrop-blur-sm transition-colors hover:bg-white/25"
      >
        <Compass size={15} /> Explore Courses
      </Link>
    </div>
  );
}

/** No enrolments yet: a pointer to the catalogue. */
export function NoCoursesYet() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-5 xs:p-8 text-center sm:p-16">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#87102C]/10 dark:bg-[#87102C]/20">
        <GraduationCap size={26} className="text-[#87102C] dark:text-[#e8768a]" />
      </span>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">You haven't enrolled in any courses yet</p>
      <p className="max-w-xs text-xs text-gray-400 dark:text-gray-500">Explore the catalog to find one that fits your season.</p>
      <Link
        href="/dashboard/explore-courses"
        className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6E0C24] transition-colors"
      >
        <Compass size={15} /> Explore Courses
      </Link>
    </div>
  );
}
