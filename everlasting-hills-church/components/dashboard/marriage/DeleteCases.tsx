"use client";

import { useState } from "react";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { showToast } from "@/components/ui/toast/toast";
import type { ApiError } from "@/lib/api/axios";
import { useDeleteApplications } from "@/lib/api/premarital";
import { button, input, secondary } from "./ui";

const WORD = "DELETE";
export const danger = `${button} bg-red-600 text-white hover:bg-red-700`;

/**
 * Deleting applications for good, after the person types DELETE. Used for one
 * case (its page) and for several ticked on the list.
 */
export function DeleteCasesDialog({ ids, open, onClose, onDeleted }: { ids: string[]; open: boolean; onClose: () => void; onDeleted: () => void }) {
  const [typed, setTyped] = useState("");
  const del = useDeleteApplications();
  const one = ids.length === 1;
  const close = () => {
    setTyped("");
    onClose();
  };
  return (
    <ConfirmDialog
      open={open}
      tone="danger"
      title={one ? "Delete this application for good?" : `Delete ${ids.length} applications for good?`}
      description={
        <div className="space-y-3">
          <p>
            {one ? "The case is" : "These cases are"} removed with everything attached: sessions, notes, history, documents and the sign-ins made for the
            couple. Members keep their usual accounts. This cannot be undone.
          </p>
          <label className="block">
            <span className="mb-1 block font-semibold text-gray-800 dark:text-white/90">Type {WORD} to confirm</span>
            <input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" spellCheck={false} className={input} />
          </label>
        </div>
      }
      confirmLabel="Delete for good"
      confirmDisabled={typed.trim().toUpperCase() !== WORD}
      loading={del.isPending}
      onCancel={close}
      onConfirm={async () => {
        try {
          const res = await del.mutateAsync(ids);
          showToast.success(res.deleted === 1 ? "Application deleted" : `${res.deleted} applications deleted`);
          setTyped("");
          onDeleted();
        } catch (err) {
          showToast.error((err as ApiError).message || "Nothing was deleted. Try again.");
        }
      }}
    />
  );
}

/** Above the list: tick every case on this page, and delete the ticked ones. */
export function SelectionBar({ pageIds, selected, onChange }: { pageIds: string[]; selected: Set<string>; onChange: (next: Set<string>) => void }) {
  const [confirming, setConfirming] = useState(false);
  const all = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  return (
    <div className="flex min-h-[44px] flex-wrap items-center gap-3 px-1">
      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-white/75">
        <input type="checkbox" checked={all} onChange={() => onChange(all ? new Set() : new Set(pageIds))} className="h-4 w-4 accent-[#87102C]" />
        {selected.size ? `${selected.size} selected` : "Select all on this page"}
      </label>
      {selected.size > 0 && (
        <>
          <button type="button" className={danger} onClick={() => setConfirming(true)}>
            Delete selected
          </button>
          <button type="button" className={secondary} onClick={() => onChange(new Set())}>
            Clear
          </button>
        </>
      )}
      <DeleteCasesDialog
        ids={Array.from(selected)}
        open={confirming}
        onClose={() => setConfirming(false)}
        onDeleted={() => {
          setConfirming(false);
          onChange(new Set());
        }}
      />
    </div>
  );
}
