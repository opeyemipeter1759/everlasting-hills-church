"use client";

import { useParams } from "next/navigation";
import MyCourseDetailClient from "@/components/dashboard/member/courses/MyCourseDetailClient";

export default function MyCourseDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  return <MyCourseDetailClient slug={slug} />;
}
