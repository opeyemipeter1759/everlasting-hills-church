import { useState } from "react";
import {
  useBulkMemberOp,
  useChangeRole,
  useDeletePerson,
  type PersonRole,
  type PersonRow,
} from "@/lib/api/people";

export function usePeopleActions(selectedRows: Record<string, PersonRow>, clearSelection: () => void) {
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignPreselect, setAssignPreselect] = useState<PersonRow[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PersonRow | null>(null);
  const [tagTarget, setTagTarget] = useState<PersonRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PersonRow | null>(null);
  const [pendingRole, setPendingRole] = useState<{ person: PersonRow; role: PersonRole } | null>(null);
  const [bulkDelete, setBulkDelete] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const changeRole = useChangeRole();
  const deletePerson = useDeletePerson();
  const bulkOp = useBulkMemberOp();

  function openAssign(preselect: PersonRow[]) {
    setAssignPreselect(preselect);
    setAssignOpen(true);
  }
  function closeAssign() {
    setAssignOpen(false);
    setAssignPreselect([]);
  }

  function cancelRoleChange() {
    if (changeRole.isPending) return;
    setPendingRole(null);
    setActionError(null);
  }
  function cancelDelete() {
    if (deletePerson.isPending) return;
    setDeleteTarget(null);
    setActionError(null);
  }
  function cancelBulkDelete() {
    if (deletePerson.isPending) return;
    setBulkDelete(false);
    setActionError(null);
  }

  async function confirmRoleChange() {
    if (!pendingRole?.person.profileId) return;
    setActionError(null);
    try {
      await changeRole.mutateAsync({ profileId: pendingRole.person.profileId, role: pendingRole.role });
      setPendingRole(null);
    } catch (err) {
      setActionError((err as { message?: string }).message ?? "Role change failed");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setActionError(null);
    try {
      await deletePerson.mutateAsync({ profileId: deleteTarget.profileId, memberId: deleteTarget.id });
      setDeleteTarget(null);
    } catch (err) {
      setActionError((err as { message?: string }).message ?? "Delete failed");
    }
  }

  async function bulkStatus(status: string) {
    await bulkOp.mutateAsync({ ids: Object.keys(selectedRows), op: "status", value: status });
    clearSelection();
  }

  async function bulkTag(op: "addTag" | "removeTag", tag: string) {
    await bulkOp.mutateAsync({ ids: Object.keys(selectedRows), op, value: tag });
    clearSelection();
  }

  async function confirmBulkDelete() {
    setActionError(null);
    try {
      for (const p of Object.values(selectedRows)) {
        await deletePerson.mutateAsync({ profileId: p.profileId, memberId: p.id });
      }
      setBulkDelete(false);
      clearSelection();
    } catch (err) {
      setActionError((err as { message?: string }).message ?? "Bulk delete failed");
    }
  }

  return {
    createOpen,
    setCreateOpen,
    assignOpen,
    assignPreselect,
    openAssign,
    closeAssign,
    cancelRoleChange,
    cancelDelete,
    cancelBulkDelete,
    filterOpen,
    setFilterOpen,
    editTarget,
    setEditTarget,
    tagTarget,
    setTagTarget,
    deleteTarget,
    setDeleteTarget,
    pendingRole,
    setPendingRole,
    bulkDelete,
    setBulkDelete,
    actionError,
    setActionError,
    changeRole,
    deletePerson,
    bulkOp,
    confirmRoleChange,
    confirmDelete,
    bulkStatus,
    bulkTag,
    confirmBulkDelete,
  };
}
