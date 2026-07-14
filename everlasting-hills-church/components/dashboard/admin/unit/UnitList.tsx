"use client";

import type { Unit } from "@/types";
import { ChevronRight } from "lucide-react";

interface UnitListProps {
  units: Unit[];
  selectedId: string | null;
  onSelect: (unitId: string) => void;
}

export default function UnitList({ units, selectedId, onSelect }: UnitListProps) {
  return (
    <div className="lg:col-span-2 lg:sticky lg:top-0 lg:h-[70vh] lg:overflow-y-auto space-y-2 pr-1">
      {units.map((u) => (
        <button
          key={u.id}
          type="button"
          onClick={() => onSelect(u.id)}
          className={`w-full text-left px-4 py-4 rounded-xl border transition-all ${
            selectedId === u.id
              ? "border-[#87102C]/40 bg-[#87102C]/5 dark:bg-[#87102C]/10"
              : "border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] hover:border-[#87102C]/20"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{u.name}</p>
              {u.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                  {u.description}
                </p>
              )}
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
                {u._count.UnitMember} member{u._count.UnitMember !== 1 ? "s" : ""}
              </p>
            </div>
            <ChevronRight
              size={16}
              className={`flex-shrink-0 mt-1 transition-colors ${
                selectedId === u.id ? "text-[#87102C]" : "text-gray-300"
              }`}
            />
          </div>
        </button>
      ))}
    </div>
  );
}