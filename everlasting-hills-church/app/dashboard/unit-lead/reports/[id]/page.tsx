"use client";

import { useParams } from "next/navigation";
import UnitReportEditorClient from "@/components/dashboard/unit-lead/UnitReportEditorClient";

export default function UnitReportDetailPage() {
  const params = useParams();
  const id = params.id as string;

  return <UnitReportEditorClient mode="edit" reportId={id} />;
}
