import Field from "./Field";
import { inputCls } from "./helpers";
import type { EventFormData, SetField } from "./useEventForm";

export default function EventFormBasics({ data, set }: { data: EventFormData; set: SetField }) {
  return (
    <>
      <Field label="Title *">
        <input
          required
          value={data.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Heaven on Earth"
          className={inputCls}
          maxLength={200}
        />
      </Field>
      <Field label="Tagline">
        <input
          value={data.tagline}
          onChange={(e) => set("tagline", e.target.value)}
          placeholder="A one-line hook for the event"
          className={inputCls}
          maxLength={300}
        />
      </Field>
      <Field label="Description">
        <textarea
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
