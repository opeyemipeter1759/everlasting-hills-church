"use client";

import { useParams } from "next/navigation";
import UnitReportEditorClient from "@/components/dashboard/unit-lead/UnitReportEditorClient";

export default function NewUnitReportPage() {
  const { unitId } = useParams<{ unitId: string }>();
  return <UnitReportEditorClient unitId={unitId} mode="create" />;
}
