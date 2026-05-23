"use client";

import { useState } from "react";
import { FileText, Download, RefreshCw, Calendar, Users, BarChart3, DollarSign } from "lucide-react";

const REPORT_TYPES = [
  {
    id: "weekly-pastor",
    label: "Weekly Pastor Report",
    description: "Attendance, new members, and follow-up items for the past week",
    icon: Calendar,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-500/10",
  },
  {
    id: "monthly-board",
    label: "Monthly Board Report",
    description: "Full growth metrics, giving summary, engagement overview, and trends",
    icon: BarChart3,
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-500/10",
  },
  {
    id: "member-directory",
    label: "Member Directory",
    description: "Full active member list with contact details (CSV)",
    icon: Users,
    color: "text-green-500",
    bg: "bg-green-50 dark:bg-green-500/10",
  },
  {
    id: "giving-report",
    label: "Giving Report",
    description: "All giving records with donor info, amounts, and categories (CSV)",
    icon: DollarSign,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-500/10",
  },
  {
    id: "attendance-export",
    label: "Attendance Export",
    description: "All attendance records per service per member (CSV)",
    icon: FileText,
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-500/10",
  },
  {
    id: "first-timer-export",
    label: "First Timers Export",
    description: "All first-timer records with follow-up info (CSV)",
    icon: Users,
    color: "text-pink-500",
    bg: "bg-pink-50 dark:bg-pink-500/10",
  },
];

export default function ReportsPanel() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleExport(reportId: string) {
    setLoading(reportId);
    setError(null);
    try {
      const res = await fetch(`/api/reports/export?type=${reportId}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Export failed.");
        return;
      }
      const blob = await res.blob();
      const contentDisposition = res.headers.get("content-disposition");
      const filename =
        contentDisposition?.match(/filename="?([^";\n]+)"?/)?.[1] ??
        `${reportId}-${new Date().toISOString().slice(0, 10)}.csv`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Generate and download reports as CSV. All data is scoped to your church.
      </p>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg p-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORT_TYPES.map((report) => {
          const Icon = report.icon;
          const isLoading = loading === report.id;
          return (
            <div
              key={report.id}
              className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/8 rounded-xl p-5 flex flex-col gap-4"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl ${report.bg} ${report.color} flex-shrink-0`}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {report.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {report.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleExport(report.id)}
                disabled={isLoading || loading !== null}
                className="mt-auto flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-50 transition"
              >
                {isLoading ? (
                  <RefreshCw size={12} className="animate-spin" />
                ) : (
                  <Download size={12} />
                )}
                {isLoading ? "Generating…" : "Download CSV"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
