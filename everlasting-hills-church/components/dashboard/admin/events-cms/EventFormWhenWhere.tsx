import Field from "./Field";
import { inputCls } from "./helpers";
import type { EventFormData, SetField } from "./useEventForm";

export default function EventFormWhenWhere({ data, set }: { data: EventFormData; set: SetField }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Starts *">
          <input
            required
            type="datetime-local"
            value={data.startAt}
            onChange={(e) => set("startAt", e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Ends">
          <input
            type="datetime-local"
            value={data.endAt}
            onChange={(e) => set("endAt", e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Venue name">
          <input
            value={data.venueName}
            onChange={(e) => set("venueName", e.target.value)}
            placeholder="Hills Auditorium"
            className={inputCls}
          />
        </Field>
        <Field label="Venue address">
          <input
            value={data.venueAddress}
            onChange={(e) => set("venueAddress", e.target.value)}
            placeholder="Ibadan, Oyo State"
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Google Maps link">
        <input
          value={data.mapsLink}
          onChange={(e) => set("mapsLink", e.target.value)}
          placeholder="https://maps.google.com/…"
          className={inputCls}
        />
      </Field>
    </>
  );
}
