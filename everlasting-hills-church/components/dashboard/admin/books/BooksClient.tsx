"use client";

import { Check, Layers, Library, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useBooks } from "./useBooks";
import BookCard from "./BookCard";
import BookFormModal from "./BookFormModal";
import CollectionFormModal from "./CollectionFormModal";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import type { BookFilter } from "./types";

const TABS: { key: BookFilter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PUBLISHED", label: "Published" },
  { key: "DRAFT", label: "Drafts" },
];

export default function BooksClient() {
  const {
    totalCount,
    isLoading,
    filter,
    setFilter,
    counts,
    collections,
    collectionsLoading,
    groups,
    formOpen,
    editingItem,
    createInCollectionId,
    openCreate,
    openEdit,
    closeForm,
    deleteTarget,
    setDeleteTarget,
    collectionModalOpen,
    editingCollection,
    openNewCollection,
    openEditCollection,
    closeCollectionModal,
    deleteCollectionTarget,
    setDeleteCollectionTarget,
    justDone,
    createMutation,
    updateMutation,
    toggleStatusMutation,
    deleteMutation,
    createCollectionMutation,
    updateCollectionMutation,
    deleteCollectionMutation,
  } = useBooks();

  const loading = isLoading || collectionsLoading;

  return (
    <div className="max-w-full mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Books</h1>
          <p className="text-sm text-gray-500 dark:text-white/50 mt-0.5">
            Organize the library into collections, then add books under each one.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openNewCollection}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-white/10 px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <Layers size={15} /> New collection
          </button>
          <button
            type="button"
            onClick={() => openCreate()}
            disabled={collections.length === 0}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#87102C] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#6E0C24] transition-colors disabled:opacity-50"
          >
            <Plus size={15} /> Add book
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 border-b border-gray-200 dark:border-white/10">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`relative px-3.5 py-2.5 text-sm font-semibold transition-colors ${
              filter === tab.key
                ? "text-[#87102C] dark:text-[#e8768a]"
                : "text-gray-500 dark:text-white/50 hover:text-gray-800 dark:hover:text-white"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs font-medium text-gray-400 dark:text-white/30">{counts[tab.key]}</span>
            {filter === tab.key && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#87102C] dark:bg-[#e8768a]" />
            )}
          </button>
        ))}
      </div>

      {justDone && (
        <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <Check size={13} /> {justDone}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 size={22} className="animate-spin" />
        </div>
      ) : collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 py-16 text-center">
          <Library size={26} className="text-gray-300 dark:text-white/20" />
          <p className="text-sm font-semibold text-gray-600 dark:text-white/60">No collections yet</p>
          <p className="text-xs text-gray-400 dark:text-white/40">
            Start with a shelf like Faith, Power, or Healing, then add books to it.
          </p>
          <button
            type="button"
            onClick={openNewCollection}
            className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#87102C] px-4 py-2 text-sm font-bold text-white hover:bg-[#6E0C24] transition-colors"
          >
            <Plus size={15} /> New collection
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.sections.map(({ collection, books }) => (
            <div key={collection.id}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">{collection.name}</h2>
                  <span className="text-xs font-medium text-gray-400 dark:text-white/30">
                    {collection._count.Book}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openCreate(collection.id)}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-500 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <Plus size={13} /> Add book
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditCollection(collection)}
                    title="Rename"
                    aria-label="Rename collection"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteCollectionTarget(collection)}
                    title="Delete"
                    aria-label="Delete collection"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {books.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 py-8 text-center">
                  <p className="text-xs text-gray-400 dark:text-white/40">No books here yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {books.map((b) => (
                    <BookCard
                      key={b.id}
                      b={b}
                      onEdit={() => openEdit(b)}
                      onDelete={() => setDeleteTarget(b)}
                      onToggleStatus={() =>
                        toggleStatusMutation.mutate({ id: b.id, status: b.status === "DRAFT" ? "PUBLISHED" : "DRAFT" })
                      }
                      togglingStatus={toggleStatusMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          {groups.uncategorized.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">Uncategorized</h2>
              <div className="space-y-3">
                {groups.uncategorized.map((b) => (
                  <BookCard
                    key={b.id}
                    b={b}
                    onEdit={() => openEdit(b)}
                    onDelete={() => setDeleteTarget(b)}
                    onToggleStatus={() =>
                      toggleStatusMutation.mutate({ id: b.id, status: b.status === "DRAFT" ? "PUBLISHED" : "DRAFT" })
                    }
                    togglingStatus={toggleStatusMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {totalCount === 0 && (
            <p className="text-center text-xs text-gray-400 dark:text-white/40 pt-2">
              No books yet — use &ldquo;Add book&rdquo; on a collection above to add your first one.
            </p>
          )}
        </div>
      )}

      <BookFormModal
        open={formOpen}
        editingItem={editingItem}
        collections={collections}
        initialCollectionId={createInCollectionId}
        onClose={closeForm}
        onCreate={(values, status) => createMutation.mutate({ values, status })}
        onUpdate={(values) => updateMutation.mutate(values)}
        creating={createMutation.isPending}
        updating={updateMutation.isPending}
      />

      <CollectionFormModal
        open={collectionModalOpen}
        editingCollection={editingCollection}
        onClose={closeCollectionModal}
        onSubmit={(name) =>
          editingCollection ? updateCollectionMutation.mutate(name) : createCollectionMutation.mutate(name)
        }
        saving={createCollectionMutation.isPending || updateCollectionMutation.isPending}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this book?"
        description={
          <>
            <span className="font-semibold text-gray-900 dark:text-white">{deleteTarget?.title}</span> will be
            permanently removed from the library.
          </>
        }
        confirmLabel="Delete"
        tone="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteCollectionTarget}
        title="Delete this collection?"
        description={
          <>
            <span className="font-semibold text-gray-900 dark:text-white">{deleteCollectionTarget?.name}</span> will
            be removed. Its books stay in the library as uncategorized, not deleted.
          </>
        }
        confirmLabel="Delete"
        tone="danger"
        loading={deleteCollectionMutation.isPending}
        onConfirm={() => {
          if (deleteCollectionTarget) deleteCollectionMutation.mutate(deleteCollectionTarget.id);
        }}
        onCancel={() => setDeleteCollectionTarget(null)}
      />
    </div>
  );
}
