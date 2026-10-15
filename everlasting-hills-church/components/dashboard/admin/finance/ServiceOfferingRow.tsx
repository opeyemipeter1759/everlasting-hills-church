"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { showToast } from "@/components/ui/toast/toast";
import { userMessageForError } from "@/lib/api/user-message";
import { formatNaira, useUpsertServiceOffering } from "@/lib/api/finance";

const shortDate = (date: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(date));

export default function ServiceOfferingRow({
  service,
}: {
  service: { id: string; name: string; scheduledAt: string; tithe: number | null; offering: number | null; recorded: boolean };
}) {
  const [editing, setEditing] = useState(false);
  const [tithe, setTithe] = useState(String(service.tithe ?? ""));
  const [offering, setOffering] = useState(String(service.offering ?? ""));
  const upsert = useUpsertServiceOffering();

  async function save() {
    const titheNum = Number(tithe) || 0;
    const offeringNum = Number(offering) || 0;
    try {
      await upsert.mutateAsync({ serviceId: service.id, data: { tithe: titheNum, offering: offeringNum } });
      showToast.success(`Recorded for ${service.name}`);
      setEditing(false);
    } catch (err) {
      showToast.error(userMessageForError(err, "Couldn't save this service's offering"));
    }
  }

  return (
    <tr className="align-top text-gray-700 dark:text-white/80">
      <td className="px-4 py-3">
        <p className="font-semibold text-gray-900 dark:text-white">{service.name}</p>
        <p className="text-xs text-gray-500 dark:text-white/50">{shortDate(service.scheduledAt)}</p>
      </td>
      {editing ? (
        <>
          <td className="px-4 py-2">
            <input
              type="number"
              min={0}
              value={tithe}
              onChange={(e) => setTithe(e.target.value)}
              className="w-28 rounded-lg border border-[#E7CDD3] dark:border-white/10 bg-white dark:bg-white/5 px-2.5 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#87102C]/20"
            />
          </td>
          <td className="px-4 py-2">
            <input
              type="number"
              min={0}
              value={offering}
              onChange={(e) => setOffering(e.target.value)}
              className="w-28 rounded-lg border border-[#E7CDD3] dark:border-white/10 bg-white dark:bg-white/5 px-2.5 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#87102C]/20"
            />
          </td>
          <td className="px-4 py-2 text-right">
            <button
              type="button"
              onClick={save}
              disabled={upsert.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#87102C] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#6E0C24] disabled:opacity-50"
            >
              {upsert.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              Save
            </button>
          </td>
        </>
      ) : (
        <>
          <td className="px-4 py-3 text-right tabular-nums">{service.tithe != null ? formatNaira(service.tithe) : "—"}</td>
          <td className="px-4 py-3 text-right tabular-nums">{service.offering != null ? formatNaira(service.offering) : "—"}</td>
          <td className="px-4 py-3 text-right">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#87102C] hover:bg-[#FFF4F6] dark:text-[#e8768a] dark:hover:bg-white/5"
            >
              {service.recorded ? "Edit" : "Record"}
            </button>
          </td>
        </>
      )}
    </tr>
  );
}
