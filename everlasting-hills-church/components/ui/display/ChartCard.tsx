"use client";
import { Download } from "lucide-react";

interface ChartCardProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  onExportPng?: () => void;
  onExportCsv?: () => void;
  minHeight?: string;
  className?: string;
}

function ExportBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white border border-gray-200 dark:border-white/10 rounded-md px-2 py-0.5 transition-colors"
    >
      <Download size={9} /> {label}
    </button>
  );
}

export function ChartCard({
  title, action, children, onExportPng, onExportCsv,
  minHeight = "min-h-[220px]", className = "",
}: ChartCardProps) {
  return (
    <div className={`bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/8">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">{title}</span>
        <div className="flex items-center gap-1.5">
          {action}
          {onExportCsv && <ExportBtn label="CSV" onClick={onExportCsv} />}
          {onExportPng && <ExportBtn label="PNG" onClick={onExportPng} />}
        </div>
      </div>
      <div className={`p-4 ${minHeight}`}>{children}</div>
    </div>
  );
}
