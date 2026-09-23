"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/overlay/Modal";
import { Select } from "@/components/ui/select";
import FileUpload from "@/components/ui/form/FileUpload";
import { EMPTY_FORM } from "./types";
import type { Book, BookCollection, BookFormValues } from "./types";

const inputCls =
  "w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#87102C]/40 focus:ring-2 focus:ring-[#87102C]/10 transition-all";
const labelCls = "block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-white/40 mb-1.5";

export default function BookFormModal({
  open,
  editingItem,
  collections,
  initialCollectionId,
  onClose,
  onCreate,
  onUpdate,
  creating,
  updating,
}: {
  open: boolean;
  editingItem: Book | null;
  collections: BookCollection[];
  initialCollectionId: string | null;
  onClose: () => void;
  onCreate: (values: BookFormValues, status: "DRAFT" | "PUBLISHED") => void;
  onUpdate: (values: BookFormValues) => void;
  creating: boolean;
  updating: boolean;
}) {
  const [values, setValues] = useState<BookFormValues>(EMPTY_FORM);
  const isEditing = !!editingItem;
  const busy = creating || updating;

  useEffect(() => {
    if (!open) return;
    setValues(
      editingItem
        ? {
            title: editingItem.title,
            author: editingItem.author ?? "",
            description: editingItem.description ?? "",
            coverUrl: editingItem.coverUrl ?? "",
            fileUrl: editingItem.fileUrl,
            collectionId: editingItem.collectionId ?? "",
          }
        : { ...EMPTY_FORM, collectionId: initialCollectionId ?? collections[0]?.id ?? "" },
    );
  }, [open, editingItem, initialCollectionId, collections]);

  const canSubmit =
    values.title.trim().length > 0 && values.fileUrl.trim().length > 0 && values.collectionId.length > 0;

  function set<K extends keyof BookFormValues>(key: K, value: BookFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function submit(status: "DRAFT" | "PUBLISHED") {
    if (!canSubmit) return;
    if (isEditing) onUpdate(values);
    else onCreate(values, status);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit book" : "Add a book"}
      description="Upload the PDF members will read in-browser, plus an optional cover."
      maxWidth="lg"
    >
      <div className="space-y-5">
        <div>
          <label className={labelCls}>Title</label>
          <input
            type="text"
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Mere Christianity"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Collection</label>
          <Select
            aria-label="Collection"
            value={values.collectionId}
            onChange={(collectionId) => set("collectionId", collectionId)}
            className={inputCls}
            placeholder="Choose a collection"
            options={collections.map((c) => ({ value: c.id, label: c.name }))}
          />
          {collections.length === 0 && (
            <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
              Add a collection first (e.g. Faith, Power, Healing) before adding a book.
            </p>
          )}
        </div>

        <div>
          <label className={labelCls}>Author</label>
          <input
            type="text"
            value={values.author}
            onChange={(e) => set("author", e.target.value)}
            placeholder="C.S. Lewis"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="What this book is about, and why the church is recommending it."
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Cover image</label>
            <FileUpload
              type="image"
              endpoint="/uploads/image"
              value={values.coverUrl}
              onChange={(url) => set("coverUrl", url)}
              disabled={busy}
            />
          </div>
          <div>
            <label className={labelCls}>PDF file</label>
            <FileUpload
              type="document"
              endpoint="/uploads/document"
              value={values.fileUrl}
              onChange={(url) => set("fileUrl", url)}
              disabled={busy}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          {isEditing ? (
            <button
              type="button"
              onClick={() => submit("PUBLISHED")}
              disabled={!canSubmit || busy}
              className="flex-1 rounded-xl bg-[#87102C] px-5 py-3 text-sm font-bold text-white hover:bg-[#6E0C24] transition-colors disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save changes"}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => submit("DRAFT")}
                disabled={!canSubmit || busy}
                className="flex-1 rounded-xl border border-gray-200 dark:border-white/10 px-5 py-3 text-sm font-bold text-gray-700 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Save as draft
              </button>
              <button
                type="button"
                onClick={() => submit("PUBLISHED")}
                disabled={!canSubmit || busy}
                className="flex-1 rounded-xl bg-[#87102C] px-5 py-3 text-sm font-bold text-white hover:bg-[#6E0C24] transition-colors disabled:opacity-50"
              >
                {busy ? "Adding…" : "Add to library"}
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
