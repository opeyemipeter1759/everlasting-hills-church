"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useReadinessSetup, type ReadinessUnit } from "@/lib/api/service-readiness";
import UpcomingServices from "./UpcomingServices";
import DepartmentRow from "./DepartmentRow";

/** Groups by department name; units with no department last. */
function groupByDepartment(units: ReadinessUnit[]): [string, ReadinessUnit[]][] {
  // A plain record: this package targets ES5, where iterating a Map needs downlevelIteration.
  const groups: Record<string, ReadinessUnit[]> = {};
  for (const u of units) {
    const key = u.department?.name ?? "No department";
    groups[key] = [...(groups[key] ?? []), u];
  }
  return Object.keys(groups).map((k): [string, ReadinessUnit[]] => [k, groups[k]]).sort(
    ([a], [b]) =>
      Number(a === "No department") - Number(b === "No department") ||
      a.localeCompare(b),
  );
}

/**
 * Service Readiness setup: each unit's inspection checklists, and the coming
 * services with the Administration Manual's deadlines.
 */
export default function ServiceReadinessSetup() {
  const { data, isLoading, isError, refetch } = useReadinessSetup();
  const groups = useMemo(() => groupByDepartment(data?.units ?? []), [data?.units]);

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-sm text-gray-500 dark:text-white/55">
        Every unit submits a plan for every Sunday and Wednesday service, with no setup needed. Here you set what is checked for each
        unit at inspection.
      </p>

      {isLoading ? (
        <div className="flex justify-center py-16 text-gray-400"><Loader2 className="animate-spin" aria-label="Loading" /></div>
      ) : isError || !data ? (
        <div role="alert" className="rounded-2xl border border-red-200 p-5 text-sm text-gray-700 dark:border-red-900 dark:text-white/75">
          Service readiness could not load.{" "}
          <button type="button" onClick={() => refetch()} className="font-semibold underline">Try again</button>
        </div>
      ) : (
        <>
          <UpcomingServices services={data.upcoming} />
          <p role="status" className="text-xs text-gray-500 dark:text-white/50">{data.units.length} units plan for each service.</p>
          {groups.map(([department, units]) => (
            <section key={department} className="space-y-2">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-white/40">{department}</h2>
              <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:divide-white/[0.06] dark:border-white/10 dark:bg-white/[0.02]">
                {units.map((u) => <DepartmentRow key={u.id} unit={u} />)}
              </ul>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
