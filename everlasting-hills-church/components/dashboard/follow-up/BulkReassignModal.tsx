"use client";

import { useState } from "react";
import { CheckCircle2, Repeat } from "lucide-react";
import Modal from "@/components/ui/overlay/Modal";
import { Combobox, type ComboOption } from "@/components/ui/form/Combobox";
import { useBulkReassign, useFollowUpTeam } from "@/lib/api/follow-up-pipeline";

interface BulkReassignModalProps {
  open: boolean;
  onClose: () => void;
  unitId: string;
  unitName?: string;
}

export function BulkReassignModal({ open, onClose, unitId, unitName }: BulkReassignModalProps) {
  const [fromAssigneeId, setFromAssigneeId] = useState("");
  const [toAssigneeId, setToAssigneeId] = useState("");
  const [result, setResult] = useState<{ reassigned: number } | null>(null);

  const { data: team, isLoading: teamLoading } = useFollowUpTeam(unitId);
  const bulkReassign = useBulkReassign();

  const options: ComboOption[] = (team ?? []).map((m) => ({ id: m.id, label: m.name }));
  const toOptions = options.filter((o) => o.id !== fromAssigneeId);

  function reset() {
    setFromAssigneeId("");
    setToAssigneeId("");
    setResult(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fromAssigneeId || !toAssigneeId) return;
    bulkReassign.mutate(
      { unitId, fromAssigneeId, toAssigneeId },
      { onSuccess: (res) => setResult(res) },
    );
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Bulk Reassign"
      description={unitName ? `Move every open entry within ${unitName} from one team member to another.` : "Move every open entry from one team member to another."}
    >
      {result ? (
        <div className="flex flex-col items-center text-center py-4 gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/15">
            <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          </span>
          <p className="text-sm font-bold text-[#111] dark:text-white">
            {result.reassigned} {result.reassigned === 1 ? "entry" : "entries"} reassigned
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="mt-1 px-4 py-2 rounded-lg text-sm font-bold text-white bg-[#87102C] hover:bg-[#6E0C24] transition-colors"
          >
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              From <span className="text-red-500">*</span>
            </label>
            <Combobox
              options={options}
              value={fromAssigneeId}
              onChange={(id) => {
                setFromAssigneeId(id);
                if (id === toAssigneeId) setToAssigneeId("");
              }}
              placeholder="Currently assigned to…"
              loading={teamLoading}
              emptyText="No team members found."
            />
          </div>

          <div className="flex justify-center">
            <Repeat size={14} className="text-gray-300 dark:text-white/25" aria-hidden="true" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              To <span className="text-red-500">*</span>
            </label>
            <Combobox
              options={toOptions}
              value={toAssigneeId}
              onChange={setToAssigneeId}
              placeholder="Move to…"
              loading={teamLoading}
              emptyText="No team members found."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!fromAssigneeId || !toAssigneeId || bulkReassign.isPending}
              className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-[#87102C] hover:bg-[#6E0C24] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bulkReassign.isPending ? "Reassigning…" : "Reassign"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
