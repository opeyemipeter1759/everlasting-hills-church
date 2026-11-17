"use client";

import { useCallback, useState } from "react";
import { useFollowUpServices } from "@/lib/api/follow-up-pipeline";
import type { PipelinePage } from "@/lib/api/pipeline";
import { Select } from "@/components/ui/select";
import MasterListPipeline from "@/components/dashboard/follow-up/MasterListPipeline";
import { PILL } from "@/components/dashboard/follow-up/filter-bits";
import { IntegrationHeader } from "./IntegrationHeader";

const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

/**
 * The Integration Team's page: the first-timer pipeline, opened on the people
 * who are integrated, with "Absent from" to see who missed a service. It is
 * the same list and the same counts the Follow Up page reads, scoped by its
 * filters, so nothing here is counted on its own.
 */
export default function IntegrationBoard() {
  const { data: services = [] } = useFollowUpServices();
  const [absentFrom, setAbsentFrom] = useState("");
  const [page, setPage] = useState<PipelinePage | undefined>();
  const onPage = useCallback((next: PipelinePage | undefined) => setPage(next), []);
  const service = services.find((s) => s.id === absentFrom) ?? null;

  return (
    <div className="space-y-4 md:px-5">
      <IntegrationHeader page={page} serviceName={service?.name ?? null} />

      <p className="text-sm text-gray-500 dark:text-white/45">
        Opens on everyone integrated. Tap a status to see anyone else, or pick a service to see who missed it.
      </p>

      <MasterListPipeline
        defaultStatus="INTEGRATED"
        fixed={{ absentFrom: absentFrom || undefined }}
        onPage={onPage}
        empty={service ? `Nobody here missed ${service.name}.` : "Nobody matches these filters."}
        filters={
          <Select
            aria-label="Absent from"
            value={absentFrom}
            onChange={setAbsentFrom}
            className={`${PILL} w-full sm:w-[15rem]`}
            options={[
              { value: "", label: "Absent from: any service" },
              ...services.map((s) => ({ value: s.id, label: `Missed ${s.name}, ${day(s.scheduledAt)}` })),
            ]}
          />
        }
      />
    </div>
  );
}
