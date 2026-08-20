"use client";

import { Check } from "lucide-react";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import GatheringComposerModal from "./GatheringComposerModal";
import GatheringsHeader from "./GatheringsHeader";
import GatheringsList from "./GatheringsList";
import { useGatheringsAdmin } from "./useGatheringsAdmin";

export default function GatheringsClient() {
  const {
    items,
    isLoading,
    isError,
    refetch,
    filter,
    setFilter,
    counts,
    composerOpen,
    editingItem,
    initialValues,
    openCreate,
    openEdit,
    closeComposer,
    submit,
    saving,
    saveError,
    toggleActive,
    deleteTarget,
    setDeleteTarget,
    confirmDelete,
    deleting,
    justDone,
  } = useGatheringsAdmin();

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <GatheringsHeader
        filter={filter}
        onFilterChange={setFilter}
        counts={counts}
        onNew={openCreate}
      />

      {justDone && (
        <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <Check size={13} /> {justDone}
        </div>
      )}

      <GatheringsList
        items={items}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        filter={filter}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        onToggleActive={toggleActive}
        busy={saving}
      />

      <GatheringComposerModal
        open={composerOpen}
        initialValues={initialValues}
        isEditing={Boolean(editingItem)}
        onClose={closeComposer}
        onSubmit={submit}
        saving={saving}
        saveError={saveError}
      />

      {/*
        Delete is the irreversible option, so it names what is lost. Pausing is
        offered in the same breath because it is what an admin taking a
        gathering off the dashboard for a season actually wants.
      */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this gathering?"
        description={
          <>
            <span className="font-semibold">{deleteTarget?.title}</span> and its schedule will be
            removed for everyone, and no further reminders will be sent. To take it off the member
            dashboard for a while instead, cancel and use Pause.
          </>
        }
        confirmLabel="Delete"
        tone="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
