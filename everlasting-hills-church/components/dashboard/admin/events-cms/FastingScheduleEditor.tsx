import { Plus, Trash2 } from "lucide-react";
import type { EventSection } from "@/types";
import Field from "./Field";
import { inputCls } from "./helpers";

type Section = Extract<EventSection, { type: "FASTING_SCHEDULE" }>;
type Content = Section["content"];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const EMPTY_FASTING_SCHEDULE: Content = {
  introduction: "",
  startDate: "",
  endDate: "",
  mealTime: "3pm",
  dryFasts: [],
  note: "",
  morningTime: "6am",
  eveningTime: "8pm",
  noMorningDays: [0],
  noEveningDays: [6],
  serviceDays: [0],
  sessionsNote: "",
  guidelines: [],
  scriptureText: "",
  scriptureReference: "",
};

/**
 * The fast's rules, not its days: the page works the calendar out from the
 * dates, the dry-fast weekends and when prayer meets.
 */
export default function FastingScheduleEditor({ section, index, update }: { section: Section; index: number; update: (section: EventSection) => void }) {
  const c = section.content;
  const set = (patch: Partial<Content>) => update({ ...section, content: { ...c, ...patch } });
  const id = (name: string) => `section-${index}-${name}`;

  return (
    <div className="space-y-5">
      <Field label="Introduction" htmlFor={id("intro")}>
        <textarea id={id("intro")} rows={2} value={c.introduction ?? ""} onChange={(e) => set({ introduction: e.target.value })} className={`${inputCls} resize-y`} />
      </Field>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="First day of the fast" htmlFor={id("start")}>
          <input id={id("start")} type="date" required value={c.startDate} onChange={(e) => set({ startDate: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Last day of the fast" htmlFor={id("end")}>
          <input id={id("end")} type="date" required value={c.endDate} onChange={(e) => set({ endDate: e.target.value })} className={inputCls} />
        </Field>
        <Field label="One meal a day, from" htmlFor={id("meal")}>
          <input id={id("meal")} required value={c.mealTime} onChange={(e) => set({ mealTime: e.target.value })} placeholder="3pm" className={inputCls} />
        </Field>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Dry-fast weekends</p>
        <div className="space-y-2">
          {c.dryFasts.map((d, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_6rem_auto] items-center gap-2">
              <input aria-label={`Dry fast ${i + 1} first day`} type="date" value={d.startDate} onChange={(e) => set({ dryFasts: c.dryFasts.map((x, k) => (k === i ? { ...x, startDate: e.target.value } : x)) })} className={inputCls} />
              <input aria-label={`Dry fast ${i + 1} last day`} type="date" value={d.endDate} onChange={(e) => set({ dryFasts: c.dryFasts.map((x, k) => (k === i ? { ...x, endDate: e.target.value } : x)) })} className={inputCls} />
              <input aria-label={`Dry fast ${i + 1} breaks at`} value={d.breakTime} onChange={(e) => set({ dryFasts: c.dryFasts.map((x, k) => (k === i ? { ...x, breakTime: e.target.value } : x)) })} placeholder="3pm" className={inputCls} />
              <button type="button" onClick={() => set({ dryFasts: c.dryFasts.filter((_, k) => k !== i) })} aria-label={`Remove dry fast ${i + 1}`} className="min-h-11 min-w-11 rounded-lg text-red-600 hover:bg-red-50">
                <Trash2 size={14} className="mx-auto" />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => set({ dryFasts: [...c.dryFasts, { startDate: "", endDate: "", breakTime: c.mealTime || "3pm" }] })} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#87102C]">
          <Plus size={13} /> Add a dry fast (first day, last day, breaks at)
        </button>
      </div>

      <Field label="Note under the weekends (optional)" htmlFor={id("note")}>
        <input id={id("note")} value={c.note ?? ""} onChange={(e) => set({ note: e.target.value })} placeholder="The closing weekend stays on one meal a day." className={inputCls} />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Morning session time" htmlFor={id("morning")}>
          <input id={id("morning")} value={c.morningTime ?? ""} onChange={(e) => set({ morningTime: e.target.value })} placeholder="6am — leave empty for none" className={inputCls} />
        </Field>
        <Field label="Evening session time" htmlFor={id("evening")}>
          <input id={id("evening")} value={c.eveningTime ?? ""} onChange={(e) => set({ eveningTime: e.target.value })} placeholder="8pm — leave empty for none" className={inputCls} />
        </Field>
      </div>
      <Weekdays label="No morning session on" values={c.noMorningDays} onChange={(v) => set({ noMorningDays: v })} />
      <Weekdays label="No evening session on" values={c.noEveningDays} onChange={(v) => set({ noEveningDays: v })} />
      <Weekdays label="Mornings that are the Sunday service" values={c.serviceDays} onChange={(v) => set({ serviceDays: v })} />
      <Field label="Evening sessions note (optional)" htmlFor={id("sessions-note")}>
        <input id={id("sessions-note")} value={c.sessionsNote ?? ""} onChange={(e) => set({ sessionsNote: e.target.value })} placeholder="In person and live on YouTube." className={inputCls} />
      </Field>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Guidelines</p>
        <div className="space-y-2">
          {c.guidelines.map((g, i) => (
            <div key={i} className="rounded-lg bg-gray-50 p-3 dark:bg-white/[0.03]">
              <div className="flex gap-2">
                <input aria-label={`Guideline ${i + 1} title`} value={g.title} onChange={(e) => set({ guidelines: c.guidelines.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)) })} placeholder="Breaking a dry fast" className={inputCls} />
                <button type="button" onClick={() => set({ guidelines: c.guidelines.filter((_, k) => k !== i) })} aria-label={`Remove guideline ${i + 1}`} className="min-h-11 min-w-11 rounded-lg text-red-600 hover:bg-red-50">
                  <Trash2 size={14} className="mx-auto" />
                </button>
              </div>
              <textarea aria-label={`Guideline ${i + 1} text`} rows={2} value={g.body} onChange={(e) => set({ guidelines: c.guidelines.map((x, k) => (k === i ? { ...x, body: e.target.value } : x)) })} className={`${inputCls} mt-2 resize-y`} />
            </div>
          ))}
        </div>
        <button type="button" onClick={() => set({ guidelines: [...c.guidelines, { title: "", body: "" }] })} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#87102C]">
          <Plus size={13} /> Add a guideline
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
        <Field label="Scripture (optional)" htmlFor={id("scripture")}>
          <textarea id={id("scripture")} rows={2} value={c.scriptureText ?? ""} onChange={(e) => set({ scriptureText: e.target.value })} className={`${inputCls} resize-y`} />
        </Field>
        <Field label="Reference" htmlFor={id("scripture-ref")}>
          <input id={id("scripture-ref")} value={c.scriptureReference ?? ""} onChange={(e) => set({ scriptureReference: e.target.value })} placeholder="Malachi 3:2" className={inputCls} />
        </Field>
      </div>
    </div>
  );
}

function Weekdays({ label, values, onChange }: { label: string; values: number[]; onChange: (values: number[]) => void }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {WEEKDAYS.map((name, d) => {
          const on = values.includes(d);
          return (
            <label key={name} className={`inline-flex min-h-9 cursor-pointer items-center rounded-lg border px-3 text-xs font-bold ${on ? "border-[#87102C] bg-[#FFF4F6] text-[#87102C]" : "border-gray-200 text-gray-500 dark:border-white/10"}`}>
              <input type="checkbox" className="sr-only" checked={on} onChange={() => onChange(on ? values.filter((v) => v !== d) : [...values, d].sort())} />
              {name}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
