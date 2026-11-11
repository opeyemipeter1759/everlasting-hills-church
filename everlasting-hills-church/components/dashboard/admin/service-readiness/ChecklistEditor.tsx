import { useState } from "react";
import { Loader2 } from "lucide-react";

const lines = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean);

/**
 * A department's two inspection checklists, one check per line, so a list can
 * be pasted straight from Part Two of the Administration Manual.
 */
export default function ChecklistEditor({ unitName, sunday, wednesday, saving, onSave, onCancel }: {
  unitName: string;
  sunday: string[];
  wednesday: string[];
  saving: boolean;
  onSave: (lists: { sunday: string[]; wednesday: string[] }) => void;
  onCancel: () => void;
}) {
  const [sundayText, setSundayText] = useState(sunday.join("\n"));
  const [wednesdayText, setWednesdayText] = useState(wednesday.join("\n"));

  const field = (id: string, label: string, value: string, onChange: (v: string) => void) => (
    <label htmlFor={id} className="grid gap-1.5 text-xs font-semibold text-gray-600 dark:text-white/60">
      <span>
        {label} <span className="font-normal text-gray-400 dark:text-white/35">· {lines(value).length} checks</span>
      </span>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        placeholder="One check per line, e.g. Cameras charged and mounted"
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-normal text-gray-800 outline-none focus:border-[#87102C]/50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
      />
    </label>
  );

  return (
    <div className="mt-3 grid gap-3 rounded-xl bg-gray-50 p-3 dark:bg-white/[0.03]">
      <p className="text-xs text-gray-500 dark:text-white/50">
        What the Administrator checks for <b>{unitName}</b> at inspection: Sunday 7:45 am, Wednesday 5:00 pm.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {field(`sun-${unitName}`, "Sunday checklist", sundayText, setSundayText)}
        {field(`wed-${unitName}`, "Wednesday checklist", wednesdayText, setWednesdayText)}
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="min-h-10 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-600 dark:border-white/10 dark:text-white/70">
          Cancel
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => onSave({ sunday: lines(sundayText), wednesday: lines(wednesdayText) })}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#87102C] px-4 text-sm font-bold text-white hover:bg-[#6E0C24] disabled:opacity-60"
        >
          {saving && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
          Save checklists
        </button>
      </div>
    </div>
  );
}
