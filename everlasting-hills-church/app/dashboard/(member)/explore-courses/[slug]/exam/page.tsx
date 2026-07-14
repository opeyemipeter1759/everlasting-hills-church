"use client";

import { useParams } from "next/navigation";
import CourseExamClient from "@/components/dashboard/member/courses/CourseExamClient";

export default function CourseExamPage() {
  const params = useParams();
  const slug = params.slug as string;

  return <CourseExamClient slug={slug} />;
}
