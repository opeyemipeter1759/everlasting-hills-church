import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { EventSchedule } from "@/types";
import Field from "./Field";
import { inputCls } from "./helpers";
import type { EventFormData, SetField } from "./useEventForm";

function blankSchedule(): EventSchedule {
  return {
    id: `new-${Date.now()}-${Math.random()}`,
    eventId: "",
    title: "",
    description: null,
    startTime: "06:00",
    endTime: null,
    recurrenceRule: "DAILY",
    meetingUrl: null,
    sortOrder: 0,
  };
}

export default function EventFormSchedule({ data, set }: { data: EventFormData; set: SetField }) {
  function update(index: number, patch: Partial<EventSchedule>) {
    set("schedules", data.schedules.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function move(index: number, direction: -1 | 1) {
    const next = [...data.schedules];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    set("schedules", next);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Starts *" htmlFor="event-start">
          <input id="event-start" required type="datetime-local" value={data.startAt} onChange={(e) => set("startAt", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Ends" htmlFor="event-end">
          <input id="event-end" type="datetime-local" value={data.endAt} onChange={(e) => set("endAt", e.target.value)} className={inputCls} />
        </Field>
      </div>
      <Field label="Timezone" htmlFor="event-timezone">
        <input id="event-timezone" value={data.timezone} onChange={(e) => set("timezone", e.target.value)} placeholder="Africa/Lagos" className={inputCls} />
        <p className="mt-1.5 text-[11px] text-gray-400">Use an IANA timezone such as Africa/Lagos.</p>
      </Field>

      <div className="flex items-center justify-between gap-3 border-t border-gray-200 pt-5 dark:border-white/10">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Meeting times</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Add each recurring session separately.</p>
        </div>
        <button type="button" onClick={() => set("schedules", [...data.schedules, blankSchedule()])} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#87102C]/25 px-3 text-xs font-bold text-[#87102C] hover:bg-[#FFF4F6]">
          <Plus size={14} /> Add time
        </button>
      </div>

      {data.schedules.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 p-5 text-center text-sm text-gray-500 dark:border-white/15">No additional meeting times. The event start time will be used.</p>
      ) : (
        <div className="space-y-3">
          {data.schedules.map((schedule, index) => (
            <fieldset key={schedule.id} className="rounded-xl border border-gray-200 p-4 dark:border-white/10">
              <legend className="px-1 text-xs font-bold text-gray-500">Session {index + 1}</legend>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Session title" htmlFor={`schedule-title-${index}`}>
                  <input id={`schedule-title-${index}`} required value={schedule.title} onChange={(e) => update(index, { title: e.target.value })} placeholder="Morning Watch" className={inputCls} />
                </Field>
                <Field label="Recurrence" htmlFor={`schedule-recurrence-${index}`}>
                  <input id={`schedule-recurrence-${index}`} value={schedule.recurrenceRule ?? ""} onChange={(e) => update(index, { recurrenceRule: e.target.value || null })} placeholder="DAILY" className={inputCls} />
                </Field>
                <Field label="Start time" htmlFor={`schedule-start-${index}`}>
                  <input id={`schedule-start-${index}`} required type="time" value={schedule.startTime} onChange={(e) => update(index, { startTime: e.target.value })} className={inputCls} />
                </Field>
                <Field label="End time" htmlFor={`schedule-end-${index}`}>
                  <input id={`schedule-end-${index}`} type="time" value={schedule.endTime ?? ""} onChange={(e) => update(index, { endTime: e.target.value || null })} className={inputCls} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Session meeting URL (optional override)" htmlFor={`schedule-url-${index}`}>
                    <input id={`schedule-url-${index}`} type="url" value={schedule.meetingUrl ?? ""} onChange={(e) => update(index, { meetingUrl: e.target.value || null })} placeholder="https://…" className={inputCls} />
                  </Field>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-1">
                <button type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`Move ${schedule.title || `session ${index + 1}`} up`} className="min-h-11 min-w-11 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-white/5"><ArrowUp size={15} className="mx-auto" /></button>
                <button type="button" disabled={index === data.schedules.length - 1} onClick={() => move(index, 1)} aria-label={`Move ${schedule.title || `session ${index + 1}`} down`} className="min-h-11 min-w-11 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-white/5"><ArrowDown size={15} className="mx-auto" /></button>
                <button type="button" onClick={() => set("schedules", data.schedules.filter((_, i) => i !== index))} aria-label={`Delete ${schedule.title || `session ${index + 1}`}`} className="min-h-11 min-w-11 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 size={15} className="mx-auto" /></button>
              </div>
            </fieldset>
          ))}
        </div>
      )}
    </div>
  );
}
