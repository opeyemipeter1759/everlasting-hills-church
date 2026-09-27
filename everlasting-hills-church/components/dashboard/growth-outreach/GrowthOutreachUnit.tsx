"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { Sprout } from "lucide-react";
import { useMyDepartmentUnits } from "@/lib/api";
import { isEvangelismUnit, isGrowthOutreachDepartment } from "@/lib/growth-outreach";
import EvangelismBoard from "@/components/dashboard/evangelism/EvangelismBoard";
import { BoardSkeleton } from "@/components/dashboard/follow-up/BoardSkeleton";
import ComingSoon from "@/components/dashboard/shell/ComingSoon";

/** One Growth & Outreach unit's page, chosen by the unit in the URL. */
export default function GrowthOutreachUnit() {
  const params = useParams<{ unitId: string }>();
  const { data: departments = [], isLoading } = useMyDepartmentUnits();

  if (isLoading) return <BoardSkeleton />;

  const department = departments.find((d) => isGrowthOutreachDepartment(d.department.name));
  const unit = department?.units.find((u) => u.id === params?.unitId);

  if (isEvangelismUnit(unit?.name)) {
    return (
      <Suspense fallback={<BoardSkeleton />}>
        <EvangelismBoard />
      </Suspense>
    );
  }

  return (
    <ComingSoon
      icon={Sprout}
      title={unit?.name ?? "Growth & Outreach"}
      description={unit ? `The ${unit.name} screen is being built. It will live here.` : "This section is being built."}
    />
  );
}
