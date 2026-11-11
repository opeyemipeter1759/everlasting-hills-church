import { useState } from "react";
import type { MyReadinessItem } from "@/lib/api/service-readiness-plans";
import StateChip from "@/components/dashboard/admin/service-readiness/StateChip";
import UpdatesTimeline from "@/components/dashboard/admin/service-readiness/UpdatesTimeline";
import { lagosTime, lagosWhen } from "@/components/dashboard/admin/service-readiness/when";
import PlanForm from "./PlanForm";
import StatusUpdateForm from "./StatusUpdateForm";

/** One unit for one coming service: submit the plan, then post updates until the service. */
export default function PlanCard({ item }: { item: MyReadinessItem }) {
  const notSent = item.plan.state === "NOT_STARTED";
  const [open, setOpen] = useState(notSent);
  const overdue = notSent && !!item.service.planDue && Date.now() > Date.parse(item.service.planDue);
  const day = item.service.serviceType === "SUNDAY" ? "Sunday" : "Wednesday";
  const approval = item.plan.approvedAt
    ? `Approved by ${item.plan.approvedBy ?? "the Administrator"} · ${lagosWhen(item.plan.approvedAt)}`
    : "Waiting for the Administrator's approval";
  return (
    <li className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[#111] dark:text-white">{item.unit.name} · {day}</p>
          <p className="text-xs text-gray-500 dark:text-white/45">
            Plan due {lagosWhen(item.service.planDue)} · ready by {lagosTime(item.service.readyBy)}
          </p>
          {!notSent && <p className="text-xs text-gray-500 dark:text-white/45">{approval}</p>}
        </div>
        <StateChip plan={item.plan} overdue={overdue} />
        {!notSent && (
          <button type="button" onClick={() => setOpen((v) => !v)} className="text-xs font-semibold text-[#87102C] hover:underline dark:text-[#FFB3C1]">
            {open ? "Close" : "Edit plan"}
          </button>
        )}
      </div>
      {open && <PlanForm item={item} onDone={() => setOpen(false)} />}
      {!notSent && !open && (
        <div className="mt-3 grid gap-3">
          <UpdatesTimeline updates={item.plan.updates} />
          <StatusUpdateForm serviceId={item.service.id} unitId={item.unit.id} />
        </div>
      )}
    </li>
  );
}
