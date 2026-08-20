"use client";

import { useParams } from "next/navigation";
import UnitMemberView from "@/components/dashboard/units/UnitMemberView";

export default function UnitMemberPage() {
  const { unitId } = useParams<{ unitId: string }>();
  return <UnitMemberView unitId={unitId} />;
}
