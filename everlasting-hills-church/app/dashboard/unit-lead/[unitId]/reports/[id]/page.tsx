"use client";

import { useParams } from "next/navigation";
import UnitReportEditorClient from "@/components/dashboard/unit-lead/UnitReportEditorClient";

export default function UnitReportDetailPage() {
  const { unitId, id } = useParams<{ unitId: string; id: string }>();
  return <UnitReportEditorClient unitId={unitId} mode="edit" reportId={id} />;
}
