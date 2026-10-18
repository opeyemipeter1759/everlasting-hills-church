"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { showToast } from "@/components/ui/toast/toast";
import { userMessageForError } from "@/lib/api/user-message";
import { useDeleteServiceOffering, useUpsertServiceOffering } from "@/lib/api/finance";

// Services run on Nigeria time (WAT, UTC+1) but scheduledAt is stored in UTC,
// so shift forward before reading the calendar day — otherwise a WAT-Sunday
// service displays as "Saturday".
const WAT_OFFSET_MS = 60 * 60 * 1000;

const dayLabel = (date: string) =>
  new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(new Date(date).getTime() + WAT_OFFSET_MS),
  );

const numberInputCls =
  "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

export default function ServiceOfferingRow({
  service,
}: {
  service: { id: string; name: string; scheduledAt: string; tithe: number | null; offering: number | null; recorded: boolean };
}) {
  const [tithe, setTithe] = useState(String(service.tithe ?? ""));
  const [offering, setOffering] = useState(String(service.offering ?? ""));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const upsert = useUpsertServiceOffering();
  const remove = useDeleteServiceOffering();

  // Stay in sync if the underlying data refreshes from elsewhere.
  useEffect(() => {
    setTithe(String(service.tithe ?? ""));
    setOffering(String(service.offering ?? ""));
  }, [service.tithe, service.offering]);

  const dirty = tithe !== String(service.tithe ?? "") || offering !== String(service.offering ?? "");

  async function save() {
    const titheNum = Number(tithe) || 0;
    const offeringNum = Number(offering) || 0;
    try {
      await upsert.mutateAsync({ serviceId: service.id, data: { tithe: titheNum, offering: offeringNum } });
      showToast.success(`Saved for ${service.name}`);
    } catch (err) {
      showToast.error(userMessageForError(err, "Couldn't save this service's offering"));
    }
  }

  async function confirmRemove() {
    try {
      await remove.mutateAsync(service.id);
      showToast.success(`Cleared offering for ${service.name}`);
      setConfirmDelete(false);
    } catch (err) {
      showToast.error(userMessageForError(err, "Couldn't delete this service's offering"));
    }
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 ${
        service.recorded
          ? "border-gray-200 dark:border-white/10"
          : "border-amber-300/70 bg-amber-50/50 dark:border-amber-500/30 dark:bg-amber-500/[0.06]"
      }`}
    >
      <div className="min-w-[150px] flex-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{dayLabel(service.scheduledAt)}</p>
        <p className="text-xs text-gray-400">{service.name}</p>
      </div>

      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-white/50">
        Tithe
        <input
          type="number"
          min={0}
          value={tithe}
          onChange={(e) => setTithe(e.target.value)}
          placeholder="0"
          className={`w-28 rounded-lg border border-[#E7CDD3] dark:border-white/10 bg-white dark:bg-white/5 px-2.5 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 ${numberInputCls}`}
        />
      </label>

      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-white/50">
        Offering
        <input
          type="number"
          min={0}
          value={offering}
          onChange={(e) => setOffering(e.target.value)}
          placeholder="0"
          className={`w-28 rounded-lg border border-[#E7CDD3] dark:border-white/10 bg-white dark:bg-white/5 px-2.5 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 ${numberInputCls}`}
        />
      </label>

      <div className="ml-auto flex items-center gap-2">
        {dirty ? (
          <button
            type="button"
            onClick={save}
            disabled={upsert.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#87102C] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#6E0C24] disabled:opacity-50"
          >
            {upsert.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            Save
          </button>
        ) : service.recorded ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <Check size={13} /> Saved
          </span>
        ) : (
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Not recorded yet</span>
        )}

        {service.recorded && !dirty && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            aria-label={`Delete recorded offering for ${service.name}`}
            className="rounded-lg p-1.5 text-gray-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this offering?"
        description={`Tithe and offering recorded for ${service.name} will be cleared.`}
        confirmLabel="Yes, delete"
        tone="danger"
        loading={remove.isPending}
        onConfirm={confirmRemove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
