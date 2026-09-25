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
