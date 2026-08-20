"use client";

import { useParams } from "next/navigation";
import UnitRolesClient from "@/components/dashboard/unit-lead/UnitRolesClient";

export default function UnitRolesPage() {
  const { unitId } = useParams<{ unitId: string }>();
  return <UnitRolesClient unitId={unitId} />;
}
