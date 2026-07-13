"use client";

import { useState } from "react";
import Modal from "@/components/ui/overlay/Modal";
import { Combobox, type ComboOption } from "@/components/ui/form/Combobox";
import type { FollowUpEntry } from "@/types/follow-up";
import { useAssignFollowUp, useFollowUpTeam } from "@/lib/api/follow-up-pipeline";

interface AssignFollowUpModalProps {
  entry: FollowUpEntry | null;
  onClose: () => void;
}

export function AssignFollowUpModal({ entry, onClose }: AssignFollowUpModalProps) {
  const [assigneeId, setAssigneeId] = useState(entry?.assignee?.id ?? "");
  // Always the caller's own team — not the entry's current unit — so claiming
  // someone from the shared "Follow-Up" pool assigns them to one of your people.
  const { data: team, isLoading: teamLoading } = useFollowUpTeam();
  const assign = useAssignFollowUp();

  const options: ComboOption[] = (team ?? []).map((m) => ({ id: m.id, label: m.name }));

  function handleClose() {
    setAssigneeId("");
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!entry || !assigneeId) return;
    assign.mutate({ id: entry.id, assigneeId }, { onSuccess: handleClose });
  }

  return (
    <Modal
      open={entry !== null}
      onClose={handleClose}
      title={entry?.assignee ? "Reassign" : "Assign"}
      description={entry ? `Choose a team member to follow up with ${entry.person.name}` : undefined}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
            Team member <span className="text-red-500">*</span>
          </label>
          <Combobox
            options={options}
            value={assigneeId}
            onChange={setAssigneeId}
            placeholder="Search by name…"
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
            disabled={!assigneeId || assign.isPending}
            className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-[#87102C] hover:bg-[#6E0C24] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {assign.isPending ? "Saving…" : entry?.assignee ? "Reassign" : "Assign"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
