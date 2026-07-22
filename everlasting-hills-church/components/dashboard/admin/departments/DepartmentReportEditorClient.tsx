"use client";

import { Inbox } from "lucide-react";
import { useMyDepartments } from "@/lib/api/departments";
import ReportEditorPage from "@/components/dashboard/reports/ReportEditorPage";
import ReportEditorSkeleton from "@/components/ui/skeleton/ReportEditorSkeleton";

export default function DepartmentReportEditorClient({ mode, reportId }: { mode: "create" | "edit"; reportId?: string }) {
  const q = useMyDepartments();

  if (q.isLoading) {
    return <ReportEditorSkeleton />;
  }

  const departments = q.data?.departments ?? [];

  if (departments.length === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-12 text-center">
          <Inbox size={26} className="mx-auto mb-3 text-gray-300 dark:text-white/20" />
          <p className="text-base font-semibold text-gray-700 dark:text-white/80">You have not been assigned a department yet.</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-white/40">
            When a Pastor or Admin assigns you as a department head, you can log reports here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ReportEditorPage
      mode={mode}
      scope="DEPARTMENT"
      targets={departments.map((d) => ({ id: d.id, name: d.name }))}
      reportId={reportId}
      backHref="/dashboard/my-department/reports"
    />
  );
}
