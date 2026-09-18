"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/overlay/Modal";
import type { BookCollection } from "./types";

const inputCls =
  "w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#87102C]/40 focus:ring-2 focus:ring-[#87102C]/10 transition-all";

export default function CollectionFormModal({
  open,
  editingCollection,
  onClose,
  onSubmit,
  saving,
}: {
  open: boolean;
  editingCollection: BookCollection | null;
  onClose: () => void;
  onSubmit: (name: string) => void;
  saving: boolean;
}) {
  const [name, setName] = useState("");
  const isEditing = !!editingCollection;

  useEffect(() => {
    if (open) setName(editingCollection?.name ?? "");
  }, [open, editingCollection]);

  const canSubmit = name.trim().length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Rename collection" : "New collection"}
      description="A shelf to group books under, e.g. Faith, Power, Healing."
      maxWidth="sm"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-white/40 mb-1.5">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Faith"
            autoFocus
            className={inputCls}
          />
        </div>
        <button
          type="button"
          onClick={() => canSubmit && onSubmit(name.trim())}
          disabled={!canSubmit || saving}
          className="w-full rounded-xl bg-[#87102C] px-5 py-3 text-sm font-bold text-white hover:bg-[#6E0C24] transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : isEditing ? "Save" : "Add collection"}
        </button>
      </div>
    </Modal>
  );
}
