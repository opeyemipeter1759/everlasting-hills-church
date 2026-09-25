import { useState } from "react";
import {
  useBulkMemberOp,
  useChangeRole,
  useDeletePerson,
  useResendLoginDetails,
  type MemberStatus,
  type PersonRole,
  type PersonRow,
} from "@/lib/api/people";
import { showToast } from "@/components/ui/toast/toast";

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
  const [pendingStatus, setPendingStatus] = useState<{ people: PersonRow[]; status: MemberStatus } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const changeRole = useChangeRole();
  const deletePerson = useDeletePerson();
  const bulkOp = useBulkMemberOp();
  const resendLoginDetails = useResendLoginDetails();

  async function resendLogin(person: PersonRow) {
    if (!person.profileId) return;
    try {
      await resendLoginDetails.mutateAsync(person.profileId);
      showToast.success(`Login details resent to ${person.name}`);
    } catch (err) {
      showToast.error((err as { message?: string }).message ?? "Couldn't resend login details");
    }
  }

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

  function requestRowStatusChange(person: PersonRow) {
    setActionError(null);
    setPendingStatus({ people: [person], status: person.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" });
  }

  function requestBulkStatusChange(status: string) {
    if (status !== "ACTIVE" && status !== "INACTIVE") return;
    setActionError(null);
    setPendingStatus({ people: Object.values(selectedRows), status });
  }

  function cancelStatusChange() {
    if (bulkOp.isPending) return;
    setPendingStatus(null);
    setActionError(null);
  }

  async function confirmStatusChange() {
    if (!pendingStatus || pendingStatus.people.length === 0) return;
    setActionError(null);
    try {
      await bulkOp.mutateAsync({
        ids: pendingStatus.people.map((person) => person.id),
        op: "status",
        value: pendingStatus.status,
      });
      showToast.success(
        pendingStatus.status === "ACTIVE"
          ? `${pendingStatus.people.length} member${pendingStatus.people.length === 1 ? "" : "s"} reactivated`
          : `${pendingStatus.people.length} member${pendingStatus.people.length === 1 ? "" : "s"} marked non-active`,
      );
      setPendingStatus(null);
      clearSelection();
    } catch (err) {
      setActionError((err as { message?: string }).message ?? "Status change failed");
    }
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
    resendLoginDetails,
    resendLogin,
    confirmRoleChange,
    confirmDelete,
    pendingStatus,
    requestRowStatusChange,
    requestBulkStatusChange,
    cancelStatusChange,
    confirmStatusChange,
    bulkTag,
    confirmBulkDelete,
  };
}
