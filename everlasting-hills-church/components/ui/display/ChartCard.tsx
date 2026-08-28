"use client";
import { useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { downloadSvgAsPng } from "@/lib/export-png";

interface ChartCardProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  /**
   * Enables the PNG button. The card finds its own chart SVG and rasterises it,
   * so a chart does not have to thread a ref through recharts to export.
   * Omit it (or pass false) when there is nothing to export yet.
   */
  exportPng?: boolean;
  onExportCsv?: () => void;
  minHeight?: string;
  className?: string;
}

function ExportBtn({
  label,
  onClick,
  busy,
}: {
  label: string;
  onClick: () => void;
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-500 transition-colors hover:text-gray-800 disabled:opacity-50 dark:border-white/10 dark:text-gray-400 dark:hover:text-white"
    >
      {busy ? <Loader2 size={9} className="animate-spin" /> : <Download size={9} />} {label}
    </button>
  );
}

export function ChartCard({
  title,
  action,
  children,
  exportPng,
  onExportCsv,
  minHeight = "min-h-[220px]",
  className = "",
}: ChartCardProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExportPng() {
    const svg = bodyRef.current?.querySelector("svg");
    if (!svg) {
      setError("Nothing to export yet.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // An SVG carries no background of its own, so a dark-theme chart would
      // export as light text on transparency. The card's own painted background
      // is the right one to bake in.
      const background = window.getComputedStyle(bodyRef.current as Element).backgroundColor;
      const opaque =
        background && background !== "rgba(0, 0, 0, 0)" && background !== "transparent"
          ? background
          : document.documentElement.classList.contains("dark")
            ? "#1c1c1e"
            : "#ffffff";
      await downloadSvgAsPng(svg as SVGSVGElement, title, opaque);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-[#1c1c1e] ${className}`}
    >
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-white/8">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
          {title}
        </span>
        <div className="flex items-center gap-1.5">
          {action}
          {onExportCsv && <ExportBtn label="CSV" onClick={onExportCsv} />}
          {exportPng && <ExportBtn label="PNG" onClick={handleExportPng} busy={busy} />}
        </div>
      </div>
      <div ref={bodyRef} className={`bg-white p-4 dark:bg-[#1c1c1e] ${minHeight}`}>
        {children}
      </div>
      {error && (
        <p className="px-4 pb-3 text-[10px] font-semibold text-red-500" role="status">
          {error}
        </p>
      )}
    </div>
  );
}
