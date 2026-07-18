"use client";

import { useParams } from "next/navigation";
import CourseCategoryAdminClient from "@/components/dashboard/admin/courses/CourseCategoryAdminClient";

export default function CourseCategoryAdminPage() {
  const params = useParams();
  const id = params.id as string;

  return <CourseCategoryAdminClient categoryId={id} />;
}
