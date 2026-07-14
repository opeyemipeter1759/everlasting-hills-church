import CourseEditorPage from "@/components/dashboard/admin/courses/CourseEditorPage";

export const metadata = { title: "New Course — Dashboard" };

export default function NewCoursePage() {
  return <CourseEditorPage mode="create" />;
}
