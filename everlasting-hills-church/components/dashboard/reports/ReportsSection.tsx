"use client";

import { useState } from "react";
import { FileText, Plus } from "lucide-react";
import { useMyReports, useCreateReport, type ReportScope } from "@/lib/api/status-reports";
import { showToast } from "@/components/ui/toast/toast";
import type { ApiError } from "@/lib/api/axios";
import ReportForm, { type ReportFormValues } from "./ReportForm";
import ReportListItem from "./ReportListItem";

function errorMessage(err: unknown, fallback: string): string {
  return (err as ApiError)?.message || fallback;
}

/** Drop-in "Reports" section for My Department (scope="DEPARTMENT") and My Unit
 * (scope="UNIT") — log a status report, see your own past reports, and reply to
 * any correction requests from the Super Admin's review. */
export default function ReportsSection({ scope, id, label }: { scope: ReportScope; id: string; label: string }) {
  const q = useMyReports();
  const create = useCreateReport();
  const [composing, setComposing] = useState(false);

  const reports = (q.data ?? []).filter((r) => (scope === "DEPARTMENT" ? r.department?.id === id : r.unit?.id === id));

  async function handleCreate(values: ReportFormValues) {
    try {
      await create.mutateAsync({
        scope,
        ...(scope === "DEPARTMENT" ? { departmentId: id } : { unitId: id }),
        title: values.title,
        content: values.content,
        attachmentUrl: values.attachmentUrl || undefined,
        attachmentName: values.attachmentName || undefined,
      });
      showToast.success("Report submitted");
      setComposing(false);
    } catch (err) {
      showToast.error(errorMessage(err, "Couldn't submit report"));
    }
  }

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-[#87102C] dark:text-[#e8768a]" />
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/50">Reports</h2>
        </div>
        {!composing && (
          <button
            type="button"
            onClick={() => setComposing(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#87102C] dark:text-[#e8768a] hover:underline"
          >
            <Plus size={13} /> Log a report
          </button>
        )}
      </div>

      {composing && (
        <div className="mb-4 rounded-xl border border-gray-100 dark:border-white/[0.06] p-3.5">
          <ReportForm submitLabel={`Submit ${label} report`} pending={create.isPending} onSubmit={handleCreate} onCancel={() => setComposing(false)} />
        </div>
      )}

      {q.isLoading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />)}
        </div>
      ) : reports.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">No reports logged yet.</p>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => <ReportListItem key={r.id} report={r} />)}
        </div>
      )}
    </section>
  );
}
