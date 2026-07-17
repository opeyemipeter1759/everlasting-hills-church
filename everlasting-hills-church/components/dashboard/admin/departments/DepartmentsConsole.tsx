"use client";

import Link from "next/link";
import { useState } from "react";
import { Building2, Users, ChevronRight, UserCog, RefreshCw, Layers } from "lucide-react";
import { useDepartments, useAssignUnits, type UnassignedUnit } from "@/lib/api/departments";
import { Avatar } from "./HeadPicker";
import { Select } from "@/components/ui/select";

export default function DepartmentsConsole() {
  const q = useDepartments();

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#e8768a]">
            Administration
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Departments</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-white/50">
            Seven administrative structures. Each Admin Head oversees the units grouped under their department.
          </p>
        </div>
        <button
          type="button"
          onClick={() => q.refetch()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
        >
          <RefreshCw size={12} className={q.isFetching ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Department grid */}
      {q.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {q.data?.departments.map((d) => (
            <Link
              key={d.id}
              href={`/dashboard/admin/departments/${d.id}`}
              className="group flex flex-col rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-5 transition-all hover:-translate-y-0.5 hover:border-[#87102C]/30 hover:shadow-[0_8px_30px_rgba(135,16,44,0.08)]"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#87102C]/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-[#87102C] dark:bg-[#87102C]/20 dark:text-[#e8768a]">
                  <Building2 size={12} /> {d.code}
                </span>
                <ChevronRight size={16} className="text-gray-300 transition-transform group-hover:translate-x-0.5 dark:text-white/20" />
              </div>
              <h2 className="text-base font-bold leading-tight text-gray-900 dark:text-white">{d.name}</h2>

              <div className="mt-4 flex items-center gap-2 border-t border-gray-100 dark:border-white/[0.06] pt-3">
                {d.head ? (
                  <>
                    <Avatar name={d.head.name} photoUrl={d.head.photoUrl} px={28} />
                    <span className="truncate text-sm font-semibold text-gray-800 dark:text-white/80">{d.head.name}</span>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 dark:text-white/40">
                    <UserCog size={15} /> No head assigned
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center gap-4 text-[11px] font-semibold text-gray-400 dark:text-white/40">
                <span className="inline-flex items-center gap-1"><Layers size={12} /> {d.unitCount} unit{d.unitCount === 1 ? "" : "s"}</span>
                <span className="inline-flex items-center gap-1"><Users size={12} /> {d.memberCount} member{d.memberCount === 1 ? "" : "s"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Unassigned units */}
      {q.data && q.data.unassignedUnits.length > 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-white/15 bg-gray-50/60 dark:bg-white/[0.02] p-5">
          <div className="mb-3 flex items-center gap-2">
            <Layers size={16} className="text-gray-400" />
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/50">
              Unassigned units ({q.data.unassignedUnits.length})
            </h2>
          </div>
          <p className="mb-4 text-xs text-gray-400 dark:text-white/40">
            These units are not yet grouped under a department. Assign each one deliberately.
          </p>
          <ul className="space-y-2">
            {q.data.unassignedUnits.map((u) => (
              <QuickAssignRow key={u.id} unit={u} departments={q.data!.departments.map((d) => ({ id: d.id, code: d.code, name: d.name }))} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function QuickAssignRow({
  unit,
  departments,
}: {
  unit: UnassignedUnit;
  departments: { id: string; code: string; name: string }[];
}) {
  const [deptId, setDeptId] = useState("");
  // A separate hook instance per row; assigns this unit to the chosen department.
  const assign = useAssignUnits(deptId);

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{unit.name}</p>
        <p className="text-[11px] text-gray-400">{unit.memberCount} member{unit.memberCount === 1 ? "" : "s"}</p>
      </div>
      <div className="flex items-center gap-2">
        <Select
          aria-label="Assign to department"
          value={deptId}
          onChange={setDeptId}
          className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-white/80 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20"
          options={[
            { value: "", label: "Assign to…" },
            ...departments.map((d) => ({ value: d.id, label: `${d.code}: ${d.name}` })),
          ]}
        />
        <button
          type="button"
          disabled={!deptId || assign.isPending}
          onClick={() => assign.mutate([unit.id])}
          className="rounded-lg bg-[#87102C] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#6E0C24] disabled:opacity-40"
        >
          {assign.isPending ? "…" : "Assign"}
        </button>
      </div>
    </li>
  );
}
