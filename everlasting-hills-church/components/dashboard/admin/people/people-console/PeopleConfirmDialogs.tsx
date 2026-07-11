import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import type { PersonRole, PersonRow } from "@/lib/api/people";
import { ROLE_LABEL } from "../peopleShared";

export default function PeopleConfirmDialogs({
  pendingRole,
  onConfirmRoleChange,
  onCancelRoleChange,
  roleChangePending,
  deleteTarget,
  onConfirmDelete,
  onCancelDelete,
  deletePending,
  bulkDelete,
  bulkCount,
  onConfirmBulkDelete,
  onCancelBulkDelete,
  actionError,
}: {
  pendingRole: { person: PersonRow; role: PersonRole } | null;
  onConfirmRoleChange: () => void;
  onCancelRoleChange: () => void;
  roleChangePending: boolean;
  deleteTarget: PersonRow | null;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  deletePending: boolean;
  bulkDelete: boolean;
  bulkCount: number;
  onConfirmBulkDelete: () => void;
  onCancelBulkDelete: () => void;
  actionError: string | null;
}) {
  return (
    <>
      <ConfirmDialog
        open={pendingRole !== null}
        title={pendingRole ? `Change role to ${ROLE_LABEL[pendingRole.role]}?` : ""}
        description={
          <span>
            <strong className="text-gray-900 dark:text-white">{pendingRole?.person.name}</strong> will move from{" "}
            <strong>{pendingRole ? ROLE_LABEL[pendingRole.person.role] : ""}</strong> to{" "}
            <strong>{pendingRole ? ROLE_LABEL[pendingRole.role] : ""}</strong>. New permissions apply immediately.
            {actionError && <span className="block mt-2 text-red-600 dark:text-red-400 text-xs">{actionError}</span>}
          </span>
        }
        confirmLabel="Yes, change role"
        tone="warning"
        loading={roleChangePending}
        onConfirm={onConfirmRoleChange}
        onCancel={onCancelRoleChange}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Permanently delete this person?"
        description={
          <span>
            <strong className="text-gray-900 dark:text-white">{deleteTarget?.name}</strong> and all their records
            (attendance, notes, follow-ups, assignments) will be permanently removed, including their sign-in
            account. This cannot be undone.
            {actionError && <span className="block mt-2 text-red-600 dark:text-red-400 text-xs">{actionError}</span>}
          </span>
        }
        confirmLabel="Yes, delete permanently"
        tone="danger"
        loading={deletePending}
        onConfirm={onConfirmDelete}
        onCancel={onCancelDelete}
      />

      <ConfirmDialog
        open={bulkDelete}
        title={`Delete ${bulkCount} people?`}
        description={
          <span>
            This permanently removes the selected people and all their records and sign-in accounts. This cannot be
            undone.
            {actionError && <span className="block mt-2 text-red-600 dark:text-red-400 text-xs">{actionError}</span>}
          </span>
        }
        confirmLabel={`Delete ${bulkCount} permanently`}
        tone="danger"
        loading={deletePending}
        onConfirm={onConfirmBulkDelete}
        onCancel={onCancelBulkDelete}
      />
    </>
  );
}
