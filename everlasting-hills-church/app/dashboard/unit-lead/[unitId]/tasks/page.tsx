"use client";

import { useParams } from "next/navigation";
import UnitTasksClient from "@/components/dashboard/unit-lead/UnitTasksClient";

export default function UnitTasksPage() {
  const { unitId } = useParams<{ unitId: string }>();
  return <UnitTasksClient unitId={unitId} />;
}
