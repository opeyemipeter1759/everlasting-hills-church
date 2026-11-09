"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAddReflection, type PastWatch } from "@/lib/api/prayer-watch";
import { fieldCls } from "./ui";

function formatEntryDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** A watch already kept, with the reflections written about it and a box to add one. */
export function PastWatchCard({ item }: { item: PastWatch }) {
  const addReflection = useAddReflection();
  const [draft, setDraft] = useState("");

  async function save() {
    const body = draft.trim();
    if (!body) return;
    await addReflection.mutateAsync({ id: item.signupId, body });
    setDraft("");
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3.5 xs:p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <p className="text-sm font-semibold text-[#111] dark:text-white">{item.watchTitle}</p>
      <p className="text-xs text-gray-500 dark:text-white/45">
        {item.watchDate} · {item.slotLabel} · {item.slotTime}
      </p>

      {item.reflections.length > 0 && (
        <div className="mt-3 space-y-2.5">
          {item.reflections.map((r) => (
            <div key={r.id} className="border-l-2 border-[#87102C]/20 pl-3 dark:border-[#FFB3C1]/20">
              <p className="text-sm leading-relaxed text-gray-700 dark:text-white/75">{r.body}</p>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-white/35">{formatEntryDate(r.createdAt)}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="What did God say during your watch hour?"
          rows={2}
          className={`${fieldCls} resize-none`}
        />
        <button
          type="button"
          onClick={save}
          disabled={addReflection.isPending || !draft.trim()}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-[#87102C] px-3.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {addReflection.isPending && <Loader2 size={12} className="animate-spin" />}
          {item.reflections.length > 0 ? "Add another" : "Save"}
        </button>
      </div>
    </div>
  );
}
