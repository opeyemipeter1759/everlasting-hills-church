"use client";

import { useState } from "react";
import { CalendarX, CircleDot, UserRound, X } from "lucide-react";
import {
  LATEST_SERVICE,
  useFollowUpServices,
  useFollowUpWorkload,
  type MasterListQuery,
  type MasterListStatus,
} from "@/lib/api/follow-up-pipeline";
import { Select } from "@/components/ui/select";
import { useFollowUpLeadership } from "./useFollowUpLeadership";
import { MasterListDates } from "./MasterListDates";
import { FilterSearch } from "./FilterSearch";
import { PILL, statusOptionsFor, type DatePreset } from "./filter-bits";

/**
 * Narrowing the roll: by name, by where someone stands, by when they came —
 * and, for a unit lead or head of department, by whose caseload they are on,
 * with each person's current load shown beside their name.
 */
export function MasterListFilters({
  value,
  scope,
  statusLocked = false,
  latestServiceId = null,
  onChange,
}: {
  value: MasterListQuery;
  scope?: MasterListQuery["scope"];
  /** The tab already fixes the status, so offering to change it would mislead. */
  statusLocked?: boolean;
  /** Which service "latest" resolved to, so the filter can name it. */
  latestServiceId?: string | null;
  onChange: (next: MasterListQuery) => void;
}) {
  const { canRunUnit } = useFollowUpLeadership();
  const { data: workload = [] } = useFollowUpWorkload(canRunUnit);
  // The Integration Team watches for members who stop coming, so their list
  // can be narrowed to whoever missed one service. Special services are not
  // called for everyone, so nobody is absent from them.
  const showAbsence = scope === "INTEGRATION";
  const { data: services = [] } = useFollowUpServices();
  const serviceOptions = services.filter((s) => s.serviceType !== "SPECIAL");
  const [preset, setPreset] = useState<DatePreset>("");
  const set = (patch: Partial<MasterListQuery>) => onChange({ ...value, ...patch });
  // On the Integration list the latest service is the starting point, so
  // only a different choice counts as filtering.
  const absenceFiltered = showAbsence
    ? value.absentFrom !== LATEST_SERVICE && value.absentFrom !== latestServiceId
    : !!value.absentFrom;
  // "latest" is shown as the service it stands for, by name.
  const absenceValue = value.absentFrom === LATEST_SERVICE ? (latestServiceId ?? "") : (value.absentFrom ?? "");
  const filtering = !!(value.status || value.from || value.to || value.assigneeId || absenceFiltered);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50/60 p-2 dark:border-white/10 dark:bg-white/[0.03]">
      <FilterSearch value={value.search ?? ""} onChange={(search) => set({ search })} />

      {!statusLocked && (
        <Select
          aria-label="Filter by status"
          value={value.status ?? ""}
          onChange={(status) => set({ status: status as MasterListStatus | "" })}
          className={`${PILL} w-full sm:w-[12.5rem]`}
          icon={<CircleDot size={15} aria-hidden="true" />}
          prefixLabel="Status:"
          placeholder="Any"
          options={[{ value: "", label: "Any status" }, ...statusOptionsFor(scope)]}
        />
      )}

      {showAbsence && (
        <Select
          aria-label="Show members absent from a service"
          value={absenceValue}
          onChange={(absentFrom) => set({ absentFrom })}
          className={`${PILL} w-full sm:w-[17rem]`}
          icon={<CalendarX size={15} aria-hidden="true" />}
          prefixLabel="Absent from:"
          placeholder="Loading…"
          options={[
            ...serviceOptions.map((service) => ({ value: service.id, label: service.name })),
            { value: "", label: "Any service" },
          ]}
        />
      )}

      {canRunUnit && (
        <Select
          aria-label="Filter by who it is assigned to"
          value={value.assigneeId ?? ""}
          onChange={(assigneeId) => set({ assigneeId })}
          className={`${PILL} w-full sm:w-[14rem]`}
          icon={<UserRound size={15} aria-hidden="true" />}
          prefixLabel="Assigned:"
          placeholder="Anyone"
          options={[
            { value: "", label: "Anyone" },
            { value: "none", label: "Nobody yet" },
            ...workload.map((person) => ({
              value: person.memberId,
              label: person.name,
              hint: String(person.count),
              group: "Follow Up team",
            })),
          ]}
        />
      )}

      <MasterListDates value={value} preset={preset} onPreset={setPreset} onChange={set} />

      {filtering && (
        <button
          type="button"
          onClick={() => {
            setPreset("");
            onChange({ search: value.search, ...(showAbsence ? { absentFrom: LATEST_SERVICE } : {}) });
          }}
          className="flex h-10 items-center gap-1 rounded-xl px-2.5 text-sm font-semibold text-[#87102C] transition-colors hover:bg-[#FFE8ED] dark:text-[#FFB3C1] dark:hover:bg-white/10"
        >
          <X size={14} aria-hidden="true" />
          Clear
        </button>
      )}
    </div>
  );
}
