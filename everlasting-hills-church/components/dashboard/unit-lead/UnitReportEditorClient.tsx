"use client";

import { Users } from "lucide-react";
import { useMyUnit } from "./useMyUnit";
import ReportEditorPage from "@/components/dashboard/reports/ReportEditorPage";
import ReportEditorSkeleton from "@/components/ui/skeleton/ReportEditorSkeleton";

export default function UnitReportEditorClient({ mode, reportId }: { mode: "create" | "edit"; reportId?: string }) {
  const { summary } = useMyUnit();

  if (summary === undefined) {
    return <ReportEditorSkeleton />;
  }

  if (!summary) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-12 text-center">
          <Users size={26} className="mx-auto mb-3 text-gray-300 dark:text-white/20" />
          <p className="text-base font-semibold text-gray-700 dark:text-white/80">You are not assigned as lead of any unit.</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-white/40">Contact an admin to be assigned to a unit.</p>
        </div>
      </div>
    );
  }

  return (
    <ReportEditorPage
      mode={mode}
      scope="UNIT"
      targets={[{ id: summary.id, name: summary.name }]}
      reportId={reportId}
      backHref="/dashboard/unit-lead/reports"
    />
  );
}
