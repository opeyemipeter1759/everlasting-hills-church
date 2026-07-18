"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Tag, Trash2, UserCheck, X } from "lucide-react";
import { STATUS_OPTIONS } from "./peopleShared";
import { Select } from "@/components/ui/select";

/**
 * Sticky bottom bar shown when one or more people are selected. Provides
 * bulk operations: change status, add/remove tag, assign to a leader,
 * export the selection, or delete.
 */
export default function BulkActionBar({
  count,
  busy,
  onClear,
  onAssign,
  onSetStatus,
  onTag,
  onExport,
  onDelete,
}: {
  count: number;
  busy: boolean;
  onClear: () => void;
  onAssign: () => void;
  onSetStatus: (status: string) => void;
  onTag: (op: "addTag" | "removeTag", tag: string) => void;
  onExport: () => void;
  onDelete: () => void;
}) {
  const [tagOpen, setTagOpen] = useState(false);
  const [tagValue, setTagValue] = useState("");

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 w-[min(94vw,720px)]"
        >
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 bg-white/95 dark:bg-[#1c0f15]/95 backdrop-blur px-4 py-3 shadow-[0_12px_50px_rgba(135,16,44,0.18)]">
            <span className="inline-flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
              <span className="flex h-6 min-w-6 px-1.5 items-center justify-center rounded-full bg-[#87102C] text-white text-xs">
                {count}
              </span>
              selected
            </span>

            <div className="h-5 w-px bg-[#E7CDD3] dark:bg-white/10 mx-1" />

            <button type="button" onClick={onAssign} disabled={busy} className={chip}>
              <UserCheck size={14} /> Assign
            </button>

            <div className="relative">
              <Select
                aria-label="Set status"
                disabled={busy}
                value=""
                onChange={(v) => { if (v) onSetStatus(v); }}
                className={`${chip} cursor-pointer`}
                options={[
                  { value: "", label: "Set status…", disabled: true },
                  ...STATUS_OPTIONS.map((s) => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase() })),
                ]}
              />
            </div>

            <button type="button" onClick={() => setTagOpen((v) => !v)} disabled={busy} className={chip}>
              <Tag size={14} /> Tag
            </button>

            <button type="button" onClick={onExport} disabled={busy} className={chip}>
              <Download size={14} /> Export
            </button>

            <button
              type="button"
              onClick={onDelete}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} /> Delete
            </button>

            <button
              type="button"
              onClick={onClear}
              className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              aria-label="Clear selection"
            >
              <X size={16} />
            </button>
          </div>

          {/* Tag entry row */}
          <AnimatePresence>
            {tagOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 flex items-center gap-2 rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 bg-white/95 dark:bg-[#1c0f15]/95 backdrop-blur px-4 py-2.5 shadow-lg overflow-hidden"
              >
                <input
                  autoFocus
                  value={tagValue}
                  onChange={(e) => setTagValue(e.target.value)}
                  placeholder="tag name…"
                  className="flex-1 text-sm rounded-lg border border-[#E7CDD3] dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#87102C]/40"
                />
                <button
                  type="button"
                  disabled={!tagValue.trim() || busy}
                  onClick={() => { onTag("addTag", tagValue.trim()); setTagValue(""); setTagOpen(false); }}
                  className="px-3 py-1.5 rounded-lg bg-[#87102C] text-white text-xs font-semibold hover:bg-[#6E0C24] disabled:opacity-50"
                >
                  Add tag
                </button>
                <button
                  type="button"
                  disabled={!tagValue.trim() || busy}
                  onClick={() => { onTag("removeTag", tagValue.trim()); setTagValue(""); setTagOpen(false); }}
                  className="px-3 py-1.5 rounded-lg border border-[#E7CDD3] dark:border-white/10 text-[#87102C] dark:text-[#e8768a] text-xs font-semibold hover:bg-[#FFF4F6] dark:hover:bg-white/5 disabled:opacity-50"
                >
                  Remove tag
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const chip =
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 dark:text-white/70 bg-[#FFF4F6] dark:bg-white/5 border border-[#E7CDD3] dark:border-white/10 hover:bg-[#FFE8ED] dark:hover:bg-white/10 transition-colors disabled:opacity-50";
