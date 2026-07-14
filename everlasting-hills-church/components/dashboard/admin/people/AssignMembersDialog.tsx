"use client";

import { useState } from "react";
import { Check, UserCheck } from "lucide-react";
import { usePeople, type PersonRow } from "@/lib/api/people";
import FormModal, { btnGhost, btnPrimary, fieldCls } from "@/components/ui/overlay/FormModal";
import { useAssignMembersForm } from "./assign-members-dialog/useAssignMembersForm";
import MembersStep from "./assign-members-dialog/MembersStep";
import LeaderStep from "./assign-members-dialog/LeaderStep";

export default function AssignMembersDialog({
  open,
  onClose,
  preselected,
}: {
  open: boolean;
  onClose: () => void;
  preselected: PersonRow[];
}) {
  const [memberSearch, setMemberSearch] = useState("");
  const [leaderSearch, setLeaderSearch] = useState("");
  const form = useAssignMembersForm(preselected, onClose);

  const memberResults = usePeople({ search: memberSearch, limit: 20 });
  // Leaders: bias to leadership roles, but allow searching anyone.
  const leaderResults = usePeople({
    search: leaderSearch,
    limit: 20,
    ...(leaderSearch ? {} : { role: "UNIT_LEAD" }),
  });

  function close() {
    setMemberSearch("");
    setLeaderSearch("");
    form.close();
  }

  return (
    <FormModal
      open={open}
      onClose={close}
      title="Assign for follow-up & discipleship"
      subtitle="Pick the people to shepherd, then choose the leader who will care for them."
      maxWidth="max-w-2xl"
      footer={
        <>
          <button type="button" className={btnGhost} onClick={close}>
            Cancel
          </button>
          <button
            type="button"
            className={btnPrimary}
            disabled={!form.leader || form.selectedIds.length === 0 || form.assign.isPending}
            onClick={form.submit}
          >
            <UserCheck size={15} />
            {form.assign.isPending ? "Assigning…" : `Assign ${form.selectedIds.length || ""}`.trim()}
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <MembersStep
          selected={form.selected}
          selectedIds={form.selectedIds}
          onRemove={form.removeMember}
          search={memberSearch}
          onSearchChange={setMemberSearch}
          rows={memberResults.data?.data ?? []}
          loading={memberResults.isLoading}
          onPick={form.toggleMember}
        />

        <LeaderStep
          leader={form.leader}
          onChangeLeader={(p) => form.setLeader({ id: p.id, name: p.name })}
          onClearLeader={() => form.setLeader(null)}
          search={leaderSearch}
          onSearchChange={setLeaderSearch}
          rows={leaderResults.data?.data ?? []}
          loading={leaderResults.isLoading}
        />

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-white/50 mb-1.5">
            Note (optional)
          </label>
          <input
            className={fieldCls}
            value={form.note}
            onChange={(e) => form.setNote(e.target.value)}
            placeholder="e.g. New convert — weekly check-in"
          />
        </div>

        {form.done && (
          <p className="text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl px-3 py-2 inline-flex items-center gap-2">
            <Check size={15} /> {form.done}
          </p>
        )}
        {form.error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-xl px-3 py-2">
            {form.error}
          </p>
        )}
      </div>
    </FormModal>
  );
}
