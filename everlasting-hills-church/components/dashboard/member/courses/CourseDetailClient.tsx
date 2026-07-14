"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, CheckCircle2, GraduationCap } from "lucide-react";
import { getCourseBySlug } from "@/lib/courses-data";
import { enrollInCourse } from "@/lib/courses-store";
import { useEnrolledCourses } from "@/hooks";
import CourseHero from "./CourseHero";
import CourseCurriculum from "./CourseCurriculum";
import CourseEnrollCard from "./CourseEnrollCard";

export default function CourseDetailClient({ slug }: { slug: string }) {
  const router = useRouter();
  const course = getCourseBySlug(slug);
  const { enrolledIds, markEnrolled } = useEnrolledCourses();
  const [enrolling, setEnrolling] = useState(false);

  if (!course) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <GraduationCap size={28} className="text-gray-300 dark:text-gray-700" />
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">This course couldn't be found.</p>
        <button
          type="button"
          onClick={() => router.push("/dashboard/explore-courses")}
          className="text-sm font-semibold text-[#87102C] hover:underline dark:text-[#e8768a]"
        >
          ← Back to Explore Courses
        </button>
      </div>
    );
  }

  const enrolled = enrolledIds.has(course.id);

  function handleEnroll() {
    if (!course) return;
    setEnrolling(true);
    // No backend yet — persist locally so the UI feels real, and note the swap point.
    setTimeout(() => {
      enrollInCourse(course.id);
      markEnrolled(course.id);
      setEnrolling(false);
      toast.success(`You're enrolled in ${course.title}!`, { icon: "🎓" });
    }, 400);
  }

  return (
    <div className="max-w-5xl space-y-6">
      <button
        type="button"
        onClick={() => router.push("/dashboard/explore-courses")}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        <ArrowLeft size={14} /> Explore Courses
      </button>

      <CourseHero course={course} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] items-start">
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-5">
            <h2 className="mb-2 text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/50">
              About this course
            </h2>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-white/60">{course.description}</p>

            <h3 className="mb-3 mt-5 text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/50">
              What you'll learn
            </h3>
            <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {course.outcomes.map((o) => (
                <li key={o} className="flex items-start gap-2 text-sm text-gray-600 dark:text-white/60">
                  <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0 text-emerald-500" />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>

          <CourseCurriculum modules={course.curriculum} />
        </div>

        <div className="lg:sticky lg:top-6">
          <CourseEnrollCard course={course} enrolled={enrolled} enrolling={enrolling} onEnroll={handleEnroll} />
        </div>
      </div>
    </div>
  );
}
