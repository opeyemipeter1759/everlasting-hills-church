"use client";

import { useParams } from "next/navigation";
import CourseDetailClient from "@/components/dashboard/member/courses/CourseDetailClient";

export default function CourseDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  return <CourseDetailClient slug={slug} />;
}
