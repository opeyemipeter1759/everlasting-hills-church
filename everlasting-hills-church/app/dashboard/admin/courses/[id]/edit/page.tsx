"use client";

import { useParams, useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { useCourseAdmin } from "@/lib/api/courses";
import CourseEditorSkeleton from "@/components/ui/skeleton/CourseEditorSkeleton";
import CourseEditorPage from "@/components/dashboard/admin/courses/CourseEditorPage";

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { data: course, isLoading } = useCourseAdmin(id);

  if (isLoading) return <CourseEditorSkeleton />;

  if (!course) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <GraduationCap size={28} className="text-gray-300 dark:text-gray-700" />
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">This course couldn't be found.</p>
        <button
          type="button"
          onClick={() => router.push("/dashboard/admin/courses")}
          className="text-sm font-semibold text-[#87102C] hover:underline dark:text-[#e8768a]"
        >
          ← Back to Courses
        </button>
      </div>
    );
  }

  return <CourseEditorPage mode="edit" course={course} />;
}
