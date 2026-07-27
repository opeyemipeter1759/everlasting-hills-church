"use client";

import { Building2, Inbox } from "lucide-react";
import { useMyDepartments } from "@/lib/api/departments";
import ReportsPageShell from "@/components/dashboard/reports/ReportsPageShell";
import ReportsListSkeleton from "@/components/ui/skeleton/ReportsListSkeleton";

export default function DepartmentReportsClient() {
  const q = useMyDepartments();

  if (q.isLoading) {
    return <ReportsListSkeleton />;
  }

  const departments = q.data?.departments ?? [];

  if (departments.length === 0) {
    return (
      <div className="mx-auto max-w-4xl">
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
    <ReportsPageShell
      scope="DEPARTMENT"
      targets={departments.map((d) => ({ id: d.id, name: d.name }))}
      icon={Building2}
      title="Department Reports"
      subtitle="Log what's happening in your department — attendance, activities, needs, wins, and concerns — for the Super Admin to review."
      basePath="/dashboard/my-department/reports"
    />
  );
}
