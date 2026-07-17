"use client";

import {
  CalendarDays,
  Download,
  Lock,
  Moon,
  Pencil,
  Sparkles,
  Sun,
  Trash2,
  Unlock,
  Users,
  type LucideIcon,
} from "lucide-react";
import Loader from "@/components/ui/feedback/Loader";
import type { ServiceRow } from "./types";
import type { ServicesApi } from "./useServices";

const TYPE_ICON: Record<string, LucideIcon> = {
  SUNDAY: Sun,
  WEDNESDAY: Moon,
  SPECIAL: Sparkles,
};

const TYPE_TONE: Record<string, string> = {
  SUNDAY: "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400",
  WEDNESDAY: "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
  SPECIAL: "bg-[#FFE8ED] dark:bg-[#87102C]/25 text-[#87102C] dark:text-[#e8768a]",
};

export default function ServiceCard({
  service: s,
  toggle,
  exportCsv,
  onEdit,
  onDelete,
}: {
  service: ServiceRow;
  toggle: ServicesApi["toggle"];
  exportCsv: (id: string) => void;
  onEdit: (s: ServiceRow) => void;
  onDelete: (s: ServiceRow) => void;
}) {
  const Icon = TYPE_ICON[s.serviceType] ?? Sun;
  const tone = TYPE_TONE[s.serviceType] ?? TYPE_TONE.SUNDAY;
  const isToggling = toggle.isPending && toggle.variables?.id === s.id;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#140b10] p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0 ${tone}`}>
            <Icon size={17} />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white truncate">{s.name}</p>
            <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5 inline-flex items-center gap-1">
              <CalendarDays size={12} />
              {new Date(s.scheduledAt).toLocaleString(undefined, {
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
        <span
          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${
            s.isOpen
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : "bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-white/40"
          }`}
        >
          {s.isOpen ? "Open" : "Closed"}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100 dark:border-white/[0.06]">
        <span className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-white/50">
          <Users size={14} />
          {s._count?.AttendanceRecord ?? 0}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => toggle.mutate({ id: s.id, open: !s.isOpen })}
            disabled={isToggling}
            title={s.isOpen ? "Close check-in" : "Open check-in"}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            {isToggling ? <Loader size="xs" /> : s.isOpen ? <Lock size={13} /> : <Unlock size={13} />}
          </button>
          <button
            onClick={() => exportCsv(s.id)}
            title="Export CSV"
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <Download size={14} />
          </button>
          <button
            onClick={() => onEdit(s)}
            title="Edit service"
            className="p-2 rounded-lg text-gray-400 hover:text-[#87102C] hover:bg-[#87102C]/5 dark:hover:bg-white/5 transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(s)}
            title="Delete service"
            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
