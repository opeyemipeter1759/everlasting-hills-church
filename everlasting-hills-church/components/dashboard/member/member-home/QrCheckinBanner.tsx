"use client";

import { useMemberQrBanner } from "@/hooks";

export function QrCheckinBanner() {
  const { qrBanner, setQrBanner } = useMemberQrBanner();
  if (!qrBanner) return null;

  return (
    <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border text-sm font-medium ${
      qrBanner.type === "success"
        ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/60 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
        : qrBanner.type === "already"
        ? "bg-sky-50 dark:bg-sky-500/10 border-sky-200/60 dark:border-sky-500/20 text-sky-700 dark:text-sky-400"
        : "bg-red-50 dark:bg-red-500/10 border-red-200/60 dark:border-red-500/20 text-red-700 dark:text-red-400"
    }`}>
      <span className="text-lg flex-shrink-0">
        {qrBanner.type === "success" ? "✅" : qrBanner.type === "already" ? "ℹ️" : "❌"}
      </span>
      <span className="flex-1">
        {qrBanner.type === "success"
          ? `Checked in to ${qrBanner.service ?? "service"} successfully!`
          : qrBanner.type === "already"
          ? `You already checked in to ${qrBanner.service ?? "this service"}.`
          : "QR check-in failed. Please try again or contact the admin."}
      </span>
      <button type="button" onClick={() => setQrBanner(null)} className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity">✕</button>
    </div>
  );
}
