"use client";

import { useState } from "react";
import Modal from "@/components/ui/overlay/Modal";
import { Combobox, type ComboOption } from "@/components/ui/form/Combobox";
import type { FollowUpSourceType } from "@/types/follow-up";
import { useAddFollowUpEntry, useFollowUpCandidates, useFollowUpTeam } from "@/lib/api/follow-up-pipeline";

interface AddToMasterListModalProps {
  open: boolean;
  onClose: () => void;
}

const TYPE_TABS: { id: FollowUpSourceType; label: string }[] = [
  { id: "FIRST_TIMER", label: "First-Timer" },
  { id: "ABSENTEE", label: "Absent Member" },
];

export function AddToMasterListModal({ open, onClose }: AddToMasterListModalProps) {
  const [sourceType, setSourceType] = useState<FollowUpSourceType>("FIRST_TIMER");
  const [personQuery, setPersonQuery] = useState("");
  const [personId, setPersonId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");

  const { data: candidates, isLoading: candidatesLoading } = useFollowUpCandidates(sourceType, personQuery);
  const { data: team, isLoading: teamLoading } = useFollowUpTeam();
  const addEntry = useAddFollowUpEntry();

  const personOptions: ComboOption[] = (candidates ?? []).map((p) => ({ id: p.id, label: p.name }));
  const assigneeOptions: ComboOption[] = (team ?? []).map((m) => ({ id: m.id, label: m.name }));

  function reset() {
    setSourceType("FIRST_TIMER");
    setPersonQuery("");
    setPersonId("");
    setAssigneeId("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleTypeChange(next: FollowUpSourceType) {
    setSourceType(next);
    setPersonQuery("");
    setPersonId("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!personId) return;

    addEntry.mutate(
      {
        sourceType,
        memberId: sourceType === "ABSENTEE" ? personId : undefined,
        visitorId: sourceType === "FIRST_TIMER" ? personId : undefined,
        assigneeId: assigneeId || undefined,
      },
      { onSuccess: handleClose },
    );
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add to Master List"
      description="Search an existing first-timer or absent member to start a follow-up."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type toggle */}
        <div className="flex gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-white/5">
          {TYPE_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleTypeChange(t.id)}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                sourceType === t.id
                  ? "bg-white dark:bg-[#1c1c1e] text-[#87102C] dark:text-[#FFB3C1] shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Person search */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
            {sourceType === "FIRST_TIMER" ? "First-Timer" : "Absent Member"} <span className="text-red-500">*</span>
          </label>
          <Combobox
            options={personOptions}
            value={personId}
            onChange={setPersonId}
            onQueryChange={setPersonQuery}
            placeholder={sourceType === "FIRST_TIMER" ? "Search first-timers…" : "Search absent members…"}
            searchPlaceholder="Type at least 2 characters…"
            loading={candidatesLoading}
            emptyText={personQuery.trim().length < 2 ? "Type to search…" : "No matching records found."}
          />
        </div>

        {/* Optional immediate assignment */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
            Assign to <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <Combobox
            options={assigneeOptions}
            value={assigneeId}
            onChange={setAssigneeId}
            placeholder="Leave unassigned for now…"
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
            disabled={!personId || addEntry.isPending}
            className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-[#87102C] hover:bg-[#6E0C24] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addEntry.isPending ? "Adding…" : "Add to List"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
