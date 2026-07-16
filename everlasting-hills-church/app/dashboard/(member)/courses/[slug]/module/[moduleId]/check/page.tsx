"use client";

import { useParams } from "next/navigation";
import ModuleCheckClient from "@/components/dashboard/member/courses/ModuleCheckClient";

export default function ModuleCheckPage() {
  const params = useParams();
  const slug = params.slug as string;
  const moduleId = params.moduleId as string;

  return <ModuleCheckClient slug={slug} moduleId={moduleId} />;
}
