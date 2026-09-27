"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import Modal from "@/components/ui/overlay/Modal";
import { showToast } from "@/components/ui/toast/toast";
import { useEvangelismTeam, useSaveOutreach, type Outreach } from "@/lib/api/evangelism";
import { primaryButton, secondaryButton } from "./bits";
import { errorText, inputClass, labelClass, todayLagos } from "./labels";

export function OutreachDialog({ open, onClose, outreach }: { open: boolean; onClose: () => void; outreach?: Outreach | null }) {
  const team = useEvangelismTeam(open);
  const save = useSaveOutreach();
  const [name, setName] = useState("");
  const [date, setDate] = useState(todayLagos());
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
  const [workers, setWorkers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setName(outreach?.name ?? "");
    setDate(outreach ? new Date(new Date(outreach.date).getTime() + 3_600_000).toISOString().slice(0, 10) : todayLagos());
    setLocation(outreach?.location ?? "");
    setDescription(outreach?.description ?? "");
    setActive(outreach?.active ?? true);
    setWorkers(outreach?.workers.map((w) => w.id) ?? []);
  }, [open, outreach]);

  // Past outreaches can list people who have since left the team.
  const people = [
    ...(team.data ?? []).map((m) => ({ id: m.id, name: m.name })),
    ...(outreach?.workers ?? []).filter((w) => !(team.data ?? []).some((m) => m.id === w.id)),
  ];
  const toggle = (id: string) => setWorkers((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Give the outreach a name.");
    if (!date) return setError("Choose the date.");
    try {
      await save.mutateAsync({
        ...(outreach ? { id: outreach.id } : {}),
        name: name.trim(),
        date,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
        active,
        workerIds: workers,
      });
      showToast.success(outreach ? "Outreach updated" : "Outreach created");
      onClose();
    } catch (err) {
      setError(errorText(err, "Couldn't save"));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={outreach ? "Edit outreach" : "New outreach"} maxWidth="lg">
      <form onSubmit={submit} noValidate className="space-y-4">
        <div>
          <span className={labelClass}>Name *</span>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Street Outreach – Sept 2026" maxLength={160} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <span className={labelClass}>Date *</span>
            <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <span className={labelClass}>Location</span>
            <input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} maxLength={200} />
          </div>
        </div>
        <div>
          <span className={labelClass}>Description</span>
          <textarea className={`${inputClass} min-h-[72px]`} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={4000} />
        </div>
        <div>
          <span className={labelClass}>Team members who went</span>
          <div className="flex max-h-56 flex-wrap gap-2 overflow-y-auto">
            {people.map((m) => {
              const on = workers.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(m.id)}
                  className={`inline-flex min-h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold ${
                    on ? "bg-[#87102C] text-white" : "border border-gray-200 text-gray-700 dark:border-white/10 dark:text-white/80"
                  }`}
                >
                  {on && <Check size={12} aria-hidden="true" />} {m.name}
                </button>
              );
            })}
            {people.length === 0 && <p className="text-sm text-gray-400">{team.isLoading ? "Loading…" : "Nobody on the team yet."}</p>}
          </div>
        </div>
        <label className="flex items-start gap-3 text-sm text-gray-700 dark:text-white/80">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#87102C]" />
          <span>
            Show on the outreach form
            <span className="block text-xs text-gray-400">Untick once the outreach is over so it stops appearing in the dropdown.</span>
          </span>
        </label>
        {error && (
          <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-white/10">
          <button type="button" onClick={onClose} className={secondaryButton}>
            Cancel
          </button>
          <button type="submit" disabled={save.isPending} className={primaryButton}>
            {save.isPending ? "Saving…" : outreach ? "Save" : "Create outreach"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
