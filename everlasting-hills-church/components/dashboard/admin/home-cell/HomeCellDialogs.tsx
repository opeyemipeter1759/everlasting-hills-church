"use client";

import { Loader2, CheckCircle, Trash2 } from "lucide-react";
import type { HomeCell } from "./useHomeCells";

function Dialog({
  open, title, description, confirmLabel, confirmIcon, confirmCls,
  onClose, onConfirm, loading,
}: {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  confirmIcon: React.ReactNode;
  confirmCls: string;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  if (!open) return null;
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 shadow-2xl p-6 space-y-5">
        <div className="space-y-1.5">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">{title}</h2>
          <p className="text-sm text-gray-500 dark:text-white/50">{description}</p>
        </div>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-500 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white disabled:opacity-60 transition-colors ${confirmCls}`}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : confirmIcon}
            {loading ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HomeCellDialogs({
  approveTarget, onCloseApprove, onConfirmApprove, approving,
  deleteTarget, onCloseDelete, onConfirmDelete, deleting,
}: {
  approveTarget: HomeCell | null;
  onCloseApprove: () => void;
  onConfirmApprove: () => void;
  approving: boolean;
  deleteTarget: HomeCell | null;
  onCloseDelete: () => void;
  onConfirmDelete: () => void;
  deleting: boolean;
}) {
  return (
    <>
      <Dialog
        open={!!approveTarget}
        title="Approve Home Cell"
        description={
          <>
            <strong className="text-gray-700 dark:text-white/80">{approveTarget?.name}</strong> will go live on the public find page immediately.
          </>
        }
        confirmLabel="Approve"
        confirmIcon={<CheckCircle size={14} />}
        confirmCls="bg-emerald-600 hover:bg-emerald-700"
        onClose={onCloseApprove}
        onConfirm={onConfirmApprove}
        loading={approving}
      />

      <Dialog
        open={!!deleteTarget}
        title="Remove Home Cell"
        description={
          <>
            This will permanently remove{" "}
            <strong className="text-gray-700 dark:text-white/80">{deleteTarget?.name}</strong>.
            {!deleteTarget?.isActive && " The cell submission will be rejected."}
          </>
        }
        confirmLabel="Remove"
        confirmIcon={<Trash2 size={14} />}
        confirmCls="bg-red-600 hover:bg-red-700"
        onClose={onCloseDelete}
        onConfirm={onConfirmDelete}
        loading={deleting}
      />
    </>
  );
}
