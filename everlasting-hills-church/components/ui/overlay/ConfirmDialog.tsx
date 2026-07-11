"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import  { Loader } from "@/components/icons";

export type ConfirmDialogTone = "danger" | "warning" | "info";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmDialogTone;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

const TONE_STYLES: Record<ConfirmDialogTone, { iconWrap: string; icon: string; button: string }> = {
  danger: {
    iconWrap: "bg-red-100 dark:bg-red-500/15",
    icon: "text-red-600 dark:text-red-400",
    button: "bg-red-600 hover:bg-red-700 focus:ring-red-500/30",
  },
  warning: {
    iconWrap: "bg-amber-100 dark:bg-amber-500/15",
    icon: "text-amber-600 dark:text-amber-400",
    button: "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500/30",
  },
  info: {
    iconWrap: "bg-[#87102C]/10 dark:bg-[#87102C]/20",
    icon: "text-[#87102C] dark:text-[#e8768a]",
    button: "bg-[#87102C] hover:bg-[#6E0C24] focus:ring-[#87102C]/30",
  },
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "info",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;
  const styles = TONE_STYLES[tone];

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !loading && onCancel()} aria-hidden="true" />
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${styles.iconWrap}`}>
              <AlertTriangle size={20} className={styles.icon} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 id="confirm-title" className="text-base font-bold text-gray-900 dark:text-white">{title}</h2>
              <div className="mt-1.5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{description}</div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={loading} className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50">
            {cancelLabel}
          </button>
          <button type="button" onClick={() => onConfirm()} disabled={loading} className={`px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors focus:outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed ${styles.button}`}>
            {loading ? <Loader/> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
