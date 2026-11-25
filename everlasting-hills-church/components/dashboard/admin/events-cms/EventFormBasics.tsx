import { Globe, Lock } from "lucide-react";
import Field from "./Field";
import { inputCls } from "./helpers";
import type { EventFormData, SetField } from "./useEventForm";

export default function EventFormBasics({ data, set }: { data: EventFormData; set: SetField }) {
  return (
    <>
      <Field label="Title *" htmlFor="event-title">
        <input
          id="event-title"
          required
          value={data.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Heaven on Earth"
          className={inputCls}
          maxLength={200}
        />
      </Field>
      <fieldset>
        <legend className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Who can see this event? *</legend>
        <div role="radiogroup" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {VISIBILITY_OPTIONS.map(({ value, label, hint, icon: Icon }) => {
            const active = data.visibility === value;
            return (
              <label
                key={value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                  active
                    ? "border-[#87102C] bg-[#FFF4F6] dark:border-rose-300/60 dark:bg-rose-300/10"
                    : "border-gray-200 hover:border-gray-300 dark:border-white/10"
                }`}
              >
                <input
                  type="radio"
                  name="event-visibility"
                  value={value}
                  checked={active}
                  onChange={() => set("visibility", value)}
                  className="sr-only"
                />
                <Icon size={16} className={`mt-0.5 flex-shrink-0 ${active ? "text-[#87102C] dark:text-rose-300" : "text-gray-400"}`} />
                <span>
                  <span className="block text-sm font-semibold text-gray-900 dark:text-white">{label}</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">{hint}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Theme" htmlFor="event-theme">
        <input
          id="event-theme"
          value={data.theme}
          onChange={(e) => set("theme", e.target.value)}
          placeholder="Dominion"
          className={inputCls}
          maxLength={200}
        />
      </Field>
      <Field label="Tagline" htmlFor="event-tagline">
        <input
          id="event-tagline"
          value={data.tagline}
          onChange={(e) => set("tagline", e.target.value)}
          placeholder="A one-line hook for the event"
          className={inputCls}
          maxLength={300}
        />
      </Field>
      </div>
      <Field label="Short description" htmlFor="event-short-description">
        <textarea
          id="event-short-description"
          rows={2}
          value={data.shortDescription}
          onChange={(e) => set("shortDescription", e.target.value)}
          placeholder="A concise summary used on event cards and in search results."
          className={`${inputCls} resize-y`}
          maxLength={500}
        />
      </Field>
      <Field label="Full description" htmlFor="event-description">
        <textarea
          id="event-description"
          rows={4}
          value={data.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="What's this gathering about?"
          className={`${inputCls} resize-y`}
          maxLength={5000}
        />
      </Field>
    </>
  );
}

const VISIBILITY_OPTIONS = [
  { value: "PUBLIC", label: "Public", hint: "Everyone can see it on the website.", icon: Globe },
  { value: "PRIVATE", label: "Private", hint: "Only signed-in members can see it.", icon: Lock },
] as const;
