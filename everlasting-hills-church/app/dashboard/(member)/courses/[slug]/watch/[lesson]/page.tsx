"use client";

import { useParams } from "next/navigation";
import CourseWatchClient from "@/components/dashboard/member/courses/CourseWatchClient";

export default function CourseWatchPage() {
  const params = useParams();
  const slug = params.slug as string;
  const lesson = params.lesson as string;

  return <CourseWatchClient slug={slug} lessonParam={lesson} />;
}
