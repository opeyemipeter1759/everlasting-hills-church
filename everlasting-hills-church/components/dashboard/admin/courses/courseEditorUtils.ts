import { GRADIENT_PRESETS } from "@/lib/courses-data";
import type { CourseAdminDetail } from "@/lib/api/courses";
import type { CourseFormFields } from "./CourseDetailsFields";

export function initialFields(course?: CourseAdminDetail): CourseFormFields {
  return {
    title: course?.title ?? "",
    tagline: course?.tagline ?? "",
    description: course?.description ?? "",
    categoryId: course?.category.id ?? "",
    duration: course?.duration ?? "",
    instructor: { name: course?.instructor.name ?? "", role: course?.instructor.role ?? "" },
  };
}

export function gradientIndexFor(course: CourseAdminDetail | undefined): number {
  if (!course) return 0;
  const i = GRADIENT_PRESETS.findIndex(([f, t]) => f === course.gradient[0] && t === course.gradient[1]);
  return i === -1 ? 0 : i;
}
