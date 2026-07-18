"use client";

import { useParams } from "next/navigation";
import ExploreCategoryClient from "@/components/dashboard/member/courses/ExploreCategoryClient";

export default function ExploreCategoryPage() {
  const params = useParams();
  const id = params.id as string;

  return <ExploreCategoryClient categoryId={id} />;
}
