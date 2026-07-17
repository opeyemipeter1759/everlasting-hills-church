"use client";

import Modal from "@/components/ui/overlay/Modal";
import Loader from "@/components/ui/feedback/Loader";
import Field, { inputCls } from "../inventory/Field";
import { useRepairForm } from "./useRepairForm";
import type { InventoryDetailApi } from "./useInventoryDetail";
import { Select } from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
] as const;

export default function LogRepairModal({
  open,
  onClose,
  logRepair,
}: {
  open: boolean;
  onClose: () => void;
  logRepair: InventoryDetailApi["logRepair"];
}) {
  const { data, set, canSave, submit, saving } = useRepairForm(logRepair, onClose);

  return (
    <Modal open={open} onClose={onClose} title="Log a repair" maxWidth="md">
      <div className="space-y-4">
        <Field label="What was wrong? *">
          <textarea
            rows={2}
            value={data.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Compressor stopped cooling"
            className={`${inputCls} resize-y`}
            maxLength={2000}
          />
        </Field>
        <Field label="What was done?">
          <textarea
            rows={2}
            value={data.resolution}
            onChange={(e) => set("resolution", e.target.value)}
            placeholder="Replaced compressor and refilled refrigerant"
            className={`${inputCls} resize-y`}
            maxLength={2000}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Cost (₦)">
            <input
              type="number"
              min={0}
              value={data.cost}
              onChange={(e) => set("cost", e.target.value)}
              placeholder="35000"
              className={inputCls}
            />
          </Field>
          <Field label="Performed by">
            <input
              value={data.performedBy}
              onChange={(e) => set("performedBy", e.target.value)}
              placeholder="Vendor or staff name"
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Status">
          <Select
            aria-label="Status"
            value={data.status}
            onChange={(v) => set("status", v as typeof data.status)}
            className={inputCls}
            options={STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label }))}
          />
        </Field>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={submit}
            disabled={!canSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving && <Loader size="xs" />}
            {saving ? "Logging…" : "Log Repair"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
