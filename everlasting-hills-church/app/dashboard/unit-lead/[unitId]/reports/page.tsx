"use client";

import { useParams } from "next/navigation";
import UnitReportsClient from "@/components/dashboard/unit-lead/UnitReportsClient";

export default function UnitReportsPage() {
  const { unitId } = useParams<{ unitId: string }>();
  return <UnitReportsClient unitId={unitId} />;
}
