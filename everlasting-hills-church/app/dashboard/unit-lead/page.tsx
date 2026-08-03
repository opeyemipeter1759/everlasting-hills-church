"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { useMyUnits } from "@/lib/api";

export default function UnitLeadIndexPage() {
  const router = useRouter();
  const { data: units, isLoading } = useMyUnits();

  useEffect(() => {
    if (units && units.length === 1) {
      router.replace(`/dashboard/unit-lead/${units[0].id}`);
    }
  }, [units, router]);

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto animate-pulse">
        <div className="h-6 w-40 bg-gray-200 dark:bg-white/10 rounded" />
        <div className="h-48 bg-gray-100 dark:bg-white/5 rounded-xl" />
      </div>
    );
  }

  if (!units || units.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">My Unit</h1>
        <div className="mt-6 bg-white dark:bg-[#1c1c1e] border border-dashed border-gray-200 dark:border-white/10 rounded-xl p-12 text-center">
          <Users size={28} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            You are not assigned as lead of any unit
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Contact an admin to be assigned to a unit.
          </p>
        </div>
      </div>
    );
  }

  if (units.length === 1) {
    return null; // redirecting
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">My Units</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">You lead or assist more than one unit — pick one.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {units.map((unit) => (
          <button
            key={unit.id}
            type="button"
            onClick={() => router.push(`/dashboard/unit-lead/${unit.id}`)}
            className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] text-left hover:border-[#87102C]/40 transition-colors"
          >
            <span className="w-9 h-9 rounded-full flex-shrink-0 bg-[#87102C]/10 dark:bg-[#87102C]/20 flex items-center justify-center">
              <Users size={16} className="text-[#87102C] dark:text-[#e8768a]" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{unit.name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {unit.totalMembers} member{unit.totalMembers !== 1 ? "s" : ""} · {unit.isLead ? "Lead" : "Assistant"}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
