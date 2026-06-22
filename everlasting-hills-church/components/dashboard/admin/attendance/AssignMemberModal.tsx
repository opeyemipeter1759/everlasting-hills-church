"use client";
import { useState } from "react";
import Modal from "@/components/ui/overlay/Modal";
import { showToast } from "@/components/ui/toast/toast";
import { Combobox, type ComboOption } from "@/components/ui/form/Combobox";
import { useUserRoles, useUsersBySpecificRole } from "@/lib/api";

interface AssignMemberModalProps {
  open: boolean;
  onClose: () => void;
  memberName: string;
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function AssignMemberModal({ open, onClose, memberName }: AssignMemberModalProps) {
  const [role, setRole] = useState("");
  const [assignToId, setAssignToId] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: roles, isLoading: rolesLoading } = useUserRoles();
  const { data: people, isLoading: peopleLoading } = useUsersBySpecificRole(role);

  const assignableRoles: ComboOption[] = (roles ?? [])
    .filter((r) => r.role !== "VISITOR")
    .map((r) => ({ id: r.role, label: `${r.label}${r.count > 0 ? ` (${r.count})` : ""}` }));

  const peopleOptions: ComboOption[] = (people ?? [])
    .filter((p) => p.member != null)
    .map((p) => ({
      id: p.profileId,
      label: `${p.member!.firstName} ${p.member!.lastName}`.trim(),
    }));

  const assigneeName = peopleOptions.find((p) => p.id === assignToId)?.label ?? "";

  function reset() {
    setRole("");
    setAssignToId("");
    setNote("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleRoleChange(next: string) {
    setRole(next);
    setAssignToId("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role || !assignToId) return;
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      showToast.success(`${memberName} assigned to ${assigneeName}`);
      handleClose();
    } catch {
      showToast.error("Failed to assign member. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Assign Member"
      description={`Assign ${memberName} to a leader or care team member`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Role */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
            Role <span className="text-red-500">*</span>
          </label>
          <Combobox
            options={assignableRoles}
            value={role}
            onChange={handleRoleChange}
            placeholder="Select a role…"
            loading={rolesLoading}
            emptyText="No roles found."
          />
        </div>

        {/* Assign to */}
        {role && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Assign to <span className="text-red-500">*</span>
            </label>
            <Combobox
              options={peopleOptions}
              value={assignToId}
              onChange={setAssignToId}
              placeholder="Search by name…"
              loading={peopleLoading}
              emptyText="No people found with this role."
            />
          </div>
        )}

        {/* Note */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
            Note <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Any context or instructions for the assignee…"
            className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#87102C]/25 focus:border-[#87102C]/40 transition resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !role || !assignToId}
            className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-[#87102C] hover:bg-[#6E0C24] focus:ring-2 focus:ring-[#87102C]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Assigning…" : "Assign"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
