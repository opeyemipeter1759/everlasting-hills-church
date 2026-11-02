"use client";

import { useState } from "react";
import { CalendarX2, X } from "lucide-react";
import { useAddBlock, useRemoveBlock, type HostDetail } from "@/lib/api/one-on-one";
import { showToast } from "@/components/ui/toast/toast";
import { errorText } from "@/components/pray-watch/shared";
import { Section, btnPrimary, formatDay, input, label, lagosToday, muted } from "./ui";

export default function DaysOffCard({ host }: { host: HostDetail }) {
  const add = useAddBlock(host.id);
  const remove = useRemoveBlock(host.id);
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;
    try {
      await add.mutateAsync({ date, note: note.trim() || undefined });
      setDate("");
      setNote("");
      showToast.success(`${formatDay(date)} blocked`);
    } catch (err) {
      showToast.error(errorText(err, "Couldn't block that day."));
    }
  }

  async function onRemove(id: string, day: string) {
    try {
      await remove.mutateAsync(id);
      showToast.success(`${formatDay(day)} is open again`);
    } catch (err) {
      showToast.error(errorText(err, "Couldn't unblock that day."));
    }
  }

  return (
    <Section icon={CalendarX2} eyebrow="Travel, conferences" title="Days off">
      <form onSubmit={onAdd} className="grid gap-3 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_auto] sm:items-end">
        <label className="flex flex-col gap-1.5">
          <span className={label}>Day</span>
          <input id="block-date" type="date" className={input} min={lagosToday()} value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={label}>Note (only you and your delegates see it)</span>
          <input id="block-note" type="text" className={input} maxLength={120} placeholder="Ministers conference" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <button type="submit" className={btnPrimary} disabled={!date || add.isPending}>
          Block day
        </button>
      </form>

      {host.blocks.length === 0 ? (
        <p className={`mt-4 text-sm ${muted}`}>No days blocked.</p>
      ) : (
        <ul className="mt-4 flex flex-wrap gap-2">
          {host.blocks.map((b) => (
            <li
              key={b.id}
              className="inline-flex items-center gap-2 rounded-full border border-[#E7CDD3] bg-[#FFE8ED]/50 py-1 pl-3 pr-1 text-sm dark:border-white/10 dark:bg-white/[0.05]"
            >
              <span className="font-semibold text-[#111] dark:text-white">{formatDay(b.date)}</span>
              {b.note && <span className={muted}>{b.note}</span>}
              <button
                type="button"
                aria-label={`Unblock ${formatDay(b.date)}`}
                className="rounded-full p-1 text-[#8a7e80] hover:bg-white hover:text-[#87102C] dark:hover:bg-white/10"
                onClick={() => onRemove(b.id, b.date)}
                disabled={remove.isPending}
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
