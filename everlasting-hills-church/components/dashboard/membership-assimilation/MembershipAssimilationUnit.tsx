"use client";

import { useParams } from "next/navigation";
import { Users2 } from "lucide-react";
import { useMyDepartmentUnits } from "@/lib/api";
import { isMembershipAssimilationDepartment } from "@/lib/membership-assimilation";
import { isFollowUpUnit, isIntegrationUnit } from "@/lib/integration-unit";
import FollowUpBoard from "@/components/dashboard/follow-up/FollowUpBoard";
import IntegrationBoard from "@/components/dashboard/integration/IntegrationBoard";
import { BoardSkeleton } from "@/components/dashboard/follow-up/BoardSkeleton";
import ComingSoon from "@/components/dashboard/shell/ComingSoon";

export default function MembershipAssimilationUnit() {
  const params = useParams<{ unitId: string }>();
  const { data: departments = [], isLoading } = useMyDepartmentUnits();

  // Until the units resolve there is no telling which page this is, so it
  // shows the shape both of them share rather than a spinner or a wrong title.
  if (isLoading) return <BoardSkeleton />;

  const department = departments.find((d) => isMembershipAssimilationDepartment(d.department.name));
  const unit = department?.units.find((u) => u.id === params?.unitId);

  if (isFollowUpUnit(unit?.name)) return <FollowUpBoard />;
  if (isIntegrationUnit(unit?.name)) return <IntegrationBoard />;

  return (
    <ComingSoon
      icon={Users2}
      title={unit?.name ?? "Membership and Assimilation"}
      description={
        unit ? `The ${unit.name} screen is being built. It will live here.` : "This section is being built."
      }
    />
  );
}
