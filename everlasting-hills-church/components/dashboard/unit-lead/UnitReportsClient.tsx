"use client";

import { Users } from "lucide-react";
import { useMyUnit } from "./useMyUnit";
import ReportsPageShell from "@/components/dashboard/reports/ReportsPageShell";
import ReportsListSkeleton from "@/components/ui/skeleton/ReportsListSkeleton";

export default function UnitReportsClient() {
  const { summary } = useMyUnit();

  if (summary === undefined) {
    return <ReportsListSkeleton />;
  }

  if (!summary) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-12 text-center">
          <Users size={26} className="mx-auto mb-3 text-gray-300 dark:text-white/20" />
          <p className="text-base font-semibold text-gray-700 dark:text-white/80">You are not assigned as lead of any unit.</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-white/40">Contact an admin to be assigned to a unit.</p>
        </div>
      </div>
    );
  }

  return (
    <ReportsPageShell
      scope="UNIT"
      targets={[{ id: summary.id, name: summary.name }]}
      icon={Users}
      title={`${summary.name} Reports`}
      subtitle="Log what's happening in your unit — attendance, activities, needs, wins, and concerns — for the Super Admin to review."
      basePath="/dashboard/unit-lead/reports"
    />
  );
}
