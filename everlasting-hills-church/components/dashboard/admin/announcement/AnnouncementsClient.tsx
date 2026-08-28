"use client";

import { Check } from "lucide-react";
import { useAnnouncements } from "./useAnnouncements";
import AnnouncementsHeader from "./AnnouncementsHeader";
import AnnouncementList from "./AnnouncementList";
import AnnouncementComposerModal from "./AnnouncementComposerModal";
import AnnouncementDetailModal from "./AnnouncementDetailModal";
import AnnouncementDialogs from "./AnnouncementDialogs";

export default function AnnouncementsClient() {
  const {
    items,
    isLoading,
    filter,
    setFilter,
    counts,
    composerOpen,
    editingItem,
    openCreate,
    openEdit,
    closeComposer,
    viewTarget,
    setViewTarget,
    deleteTarget,
    setDeleteTarget,
    publishTarget,
    openPublish,
    setPublishTarget,
    publishSendEmail,
    setPublishSendEmail,
    unpublishTarget,
    setUnpublishTarget,
    justDone,
    createMutation,
    updateMutation,
    publishMutation,
    unpublishMutation,
    deleteMutation,
  } = useAnnouncements();

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <AnnouncementsHeader filter={filter} onFilterChange={setFilter} counts={counts} onNew={openCreate} />

      {justDone && (
        <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <Check size={13} /> {justDone}
        </div>
      )}

      <AnnouncementList
        items={items}
        isLoading={isLoading}
        filter={filter}
        onView={setViewTarget}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        onPublish={openPublish}
        onUnpublish={setUnpublishTarget}
      />

      <AnnouncementComposerModal
        open={composerOpen}
        editingItem={editingItem}
        onClose={closeComposer}
        onCreate={(values, status) => createMutation.mutate({ values, status })}
        onUpdate={(values) => updateMutation.mutate(values)}
        creating={createMutation.isPending}
        updating={updateMutation.isPending}
      />

      <AnnouncementDetailModal a={viewTarget} onClose={() => setViewTarget(null)} />

      <AnnouncementDialogs
        deleteTarget={deleteTarget}
        onCloseDelete={() => setDeleteTarget(null)}
        onConfirmDelete={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
        deleting={deleteMutation.isPending}
        publishTarget={publishTarget}
        onClosePublish={() => setPublishTarget(null)}
        onConfirmPublish={() => {
          if (publishTarget) {
            publishMutation.mutate({ id: publishTarget.id, sendEmail: publishSendEmail });
          }
        }}
        publishing={publishMutation.isPending}
        publishSendEmail={publishSendEmail}
        onPublishSendEmailChange={setPublishSendEmail}
        unpublishTarget={unpublishTarget}
        onCloseUnpublish={() => setUnpublishTarget(null)}
        onConfirmUnpublish={() => {
          if (unpublishTarget) unpublishMutation.mutate(unpublishTarget.id);
        }}
        unpublishing={unpublishMutation.isPending}
      />
    </div>
  );
}
