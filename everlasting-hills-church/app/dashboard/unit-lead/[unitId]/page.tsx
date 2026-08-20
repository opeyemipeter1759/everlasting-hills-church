"use client";

import { useParams } from "next/navigation";
import UnitLeadDashboard from "@/components/dashboard/unit-lead/UnitLeadDashboard";

export default function UnitLeadPage() {
  const { unitId } = useParams<{ unitId: string }>();
  return <UnitLeadDashboard unitId={unitId} />;
}
