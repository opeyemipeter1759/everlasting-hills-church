"use client";

import ReportEditorPage from "@/components/dashboard/reports/ReportEditorPage";

export default function PastorReportEditorClient({ mode, reportId }: { mode: "create" | "edit"; reportId?: string }) {
  return <ReportEditorPage mode={mode} scope="PASTOR" reportId={reportId} backHref="/dashboard/pastor/reports" />;
}
