"use client";

import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { useMe } from "@/lib/api";
import { useCourse, useMyCourseProgress } from "@/lib/api/courses";
import CertificatePreviewPanel, { certificateNoFor } from "./CertificatePreviewPanel";
import CourseExamSkeleton from "@/components/ui/skeleton/CourseExamSkeleton";

export default function CourseCertificateClient({ slug }: { slug: string }) {
  const { data: me } = useMe();
  const { data: course, isLoading: courseLoading } = useCourse(slug);
  const { data: progress = {}, isLoading: progressLoading } = useMyCourseProgress();

  if (courseLoading || progressLoading) return <CourseExamSkeleton />;

  if (!course) {
    return <Empty label="This course couldn't be found." backHref="/dashboard/courses" />;
  }

  const backHref = `/dashboard/courses/${course.slug}`;
  const courseProgress = progress[course.id];

  if (!courseProgress?.completed) {
    return (
      <Empty
        label="Complete this course to unlock your certificate."
        backHref={backHref}
        courseTitle={course.title}
      />
    );
  }

  const memberName = `${me?.member?.firstName ?? ""} ${me?.member?.lastName ?? ""}`.trim() || "Member";
  const certificateNo = certificateNoFor(me?.member?.id ?? "member", course.id);

  return (
    <div className="max-w-5xl space-y-5">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        <ArrowLeft size={14} /> {course.title}
      </Link>

      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#87102C] dark:text-[#e8768a]">
          Certificate of Training
        </p>
        <h1 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{course.title}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-white/50">
          Congratulations, {memberName.split(" ")[0]} — download or share your certificate below.
        </p>
      </div>

      <CertificatePreviewPanel
        memberName={memberName}
        courseTitle={course.title}
        completedAt={courseProgress.completedAt}
        certificateNo={certificateNo}
      />
    </div>
  );
}

function Empty({ label, backHref, courseTitle }: { label: string; backHref: string; courseTitle?: string }) {
  return (
    <div className="max-w-2xl space-y-4">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        <ArrowLeft size={14} /> {courseTitle ?? "Courses"}
      </Link>
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-gray-200 dark:border-white/10 p-16 text-center">
        <GraduationCap size={28} className="text-gray-300 dark:text-gray-700" />
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</p>
      </div>
    </div>
  );
}
