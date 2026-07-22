"use client";

import { useParams } from "next/navigation";
import DepartmentReportEditorClient from "@/components/dashboard/admin/departments/DepartmentReportEditorClient";

export default function DepartmentReportDetailPage() {
  const params = useParams();
  const id = params.id as string;

  return <DepartmentReportEditorClient mode="edit" reportId={id} />;
}
