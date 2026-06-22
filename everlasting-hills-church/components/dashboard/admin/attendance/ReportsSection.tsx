"use client";
import { useState } from "react";
import { Download, FileSpreadsheet, FileText, BarChart3 } from "lucide-react";
import { reports } from "@/lib/api";

function thisMonth() { return new Date().toISOString().slice(0, 7); }
function today() { return new Date().toISOString().slice(0, 10); }
function monthStart() { return `${thisMonth()}-01`; }

interface ReportCard {
  title: string;
  desc: string;
  icon: React.ReactNode;
  accent: string;
  action: () => Promise<void>;
}

function Card({ title, desc, icon, accent, action }: ReportCard) {
  const [busy, setBusy] = useState(false);
  async function go() {
    if (busy) return;
    setBusy(true);
    try { await action(); } finally { setBusy(false); }
  }
  return (
    <div className="group relative bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-5 flex flex-col gap-3 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 hover:border-gray-300 dark:hover:border-white/20">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}>{icon}</div>
      <div>
        <p className="text-sm font-bold text-gray-900 dark:text-white">{title}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{desc}</p>
      </div>
      <button type="button" onClick={go} disabled={busy}
        className="mt-auto inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-[#87102C] dark:hover:text-[#e8768a] disabled:opacity-50 transition-colors">
        <Download size={11} className={busy ? "animate-bounce" : ""} />
        {busy ? "Generating…" : "Download"}
      </button>
    </div>
  );
}

export function ReportsSection() {
  const CARDS: ReportCard[] = [
    {
      title: "Monthly Summary",
      desc: `All attendance for ${thisMonth()} — Excel`,
      icon: <FileText size={16} className="text-blue-600 dark:text-blue-400" />,
      accent: "bg-blue-50 dark:bg-blue-500/10",
      action: () => reports.monthly(thisMonth()),
    },
    {
      title: "Date Range Export",
      desc: `${monthStart()} → ${today()} — Excel`,
      icon: <FileSpreadsheet size={16} className="text-emerald-600 dark:text-emerald-400" />,
      accent: "bg-emerald-50 dark:bg-emerald-500/10",
      action: () => reports.range(monthStart(), today()),
    },
    {
      title: "Service Comparison",
      desc: `Sunday vs Wednesday — ${thisMonth()} — Excel`,
      icon: <BarChart3 size={16} className="text-purple-600 dark:text-purple-400" />,
      accent: "bg-purple-50 dark:bg-purple-500/10",
      action: () => reports.serviceComparison(thisMonth()),
    },
    {
      title: "Full History Export",
      desc: "All-time attendance records — Excel",
      icon: <FileSpreadsheet size={16} className="text-[#87102C] dark:text-[#e8768a]" />,
      accent: "bg-[#87102C]/10 dark:bg-[#87102C]/15",
      action: () => reports.range("2020-01-01", today()),
    },
  ];

  return (
    <div>
      <div className="mb-3">
        <p className="text-sm font-bold text-gray-900 dark:text-white">Reports &amp; Exports</p>
        <p className="text-[11px] text-gray-400">Download attendance data as Excel for offline analysis</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {CARDS.map((c) => <Card key={c.title} {...c} />)}
      </div>
    </div>
  );
}
