"use client";

import { useParams } from "next/navigation";
import CourseAdminDetailClient from "@/components/dashboard/admin/courses/CourseAdminDetailClient";

export default function CourseAdminDetailPage() {
  const params = useParams();
  const id = params.id as string;

  return <CourseAdminDetailClient id={id} />;
}
