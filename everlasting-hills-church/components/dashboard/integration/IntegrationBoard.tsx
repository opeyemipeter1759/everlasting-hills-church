"use client";

import { useCallback, useState } from "react";
import { useFollowUpServices } from "@/lib/api/follow-up-pipeline";
import { usePipeline, type PipelinePage } from "@/lib/api/pipeline";
import { Select } from "@/components/ui/select";
import MasterListPipeline from "@/components/dashboard/follow-up/MasterListPipeline";
import { PILL } from "@/components/dashboard/follow-up/filter-bits";
import { IntegrationHeader } from "./IntegrationHeader";
import { AttendanceChoice, type Attendance } from "./AttendanceChoice";

const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

/**
 * The Integration Team's page: everyone in the first-timer pipeline, with the
 * status chips to narrow it, and a service to see who came and who missed it.
 * It is the same list and the same counts the Follow Up page reads, scoped by
 * its filters, so nothing here is counted on its own.
 */
export default function IntegrationBoard() {
  const { data: services = [] } = useFollowUpServices();
  const [serviceId, setServiceId] = useState("");
  const [attendance, setAttendance] = useState<Attendance>("everyone");
  const [page, setPage] = useState<PipelinePage | undefined>();
  const onPage = useCallback((next: PipelinePage | undefined) => setPage(next), []);
  const service = services.find((s) => s.id === serviceId) ?? null;
  // How many came and how many missed, whatever the list is showing: two counts, no rows.
  const came = usePipeline({ presentAt: serviceId, take: 1 }, !!serviceId);
  const missed = usePipeline({ absentFrom: serviceId, take: 1 }, !!serviceId);

  const pickService = (id: string) => {
    setServiceId(id);
    if (!id) setAttendance("everyone");
  };

  return (
    <div className="space-y-4 md:px-5">
      <IntegrationHeader
        page={page}
        service={service ? { name: service.name, came: came.data?.counts.all, missed: missed.data?.counts.all } : null}
      />

      <p className="text-sm text-gray-500 dark:text-white/45">
        Everyone is listed. Tap a status to narrow it, or pick a service to see who came and who missed it.
      </p>

      <MasterListPipeline
        fixed={{
          presentAt: serviceId && attendance === "came" ? serviceId : undefined,
          absentFrom: serviceId && attendance === "missed" ? serviceId : undefined,
        }}
        onPage={onPage}
        empty={service && attendance === "missed" ? `Nobody here missed ${service.name}.` : "Nobody matches these filters."}
        filters={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Select
              aria-label="Service"
              value={serviceId}
              onChange={pickService}
              className={`${PILL} w-full sm:w-[15rem]`}
              options={[
                { value: "", label: "Attendance: pick a service" },
                ...services.map((s) => ({ value: s.id, label: `${s.name}, ${day(s.scheduledAt)}` })),
              ]}
            />
            {service && <AttendanceChoice value={attendance} onChange={setAttendance} />}
          </div>
        }
      />
    </div>
  );
}
