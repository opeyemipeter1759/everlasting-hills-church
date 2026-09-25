import Field from "./Field";
import { inputCls } from "./helpers";
import type { EventFormData, SetField } from "./useEventForm";

export default function EventFormLocation({ data, set }: { data: EventFormData; set: SetField }) {
  const hasPhysicalLocation = data.locationType !== "ONLINE";
  return (
    <div className="space-y-5">
      <Field label="Location type" htmlFor="event-location-type">
        <select id="event-location-type" value={data.locationType} onChange={(e) => set("locationType", e.target.value as EventFormData["locationType"])} className={inputCls}>
          <option value="PHYSICAL">Physical</option>
          <option value="ONLINE">Online</option>
          <option value="HYBRID">Hybrid</option>
        </select>
      </Field>
      {hasPhysicalLocation && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Venue name" htmlFor="event-venue"><input id="event-venue" value={data.venueName} onChange={(e) => set("venueName", e.target.value)} placeholder="Hills Auditorium" className={inputCls} /></Field>
            <Field label="Address" htmlFor="event-address"><input id="event-address" value={data.venueAddress} onChange={(e) => set("venueAddress", e.target.value)} placeholder="Ibadan, Oyo State" className={inputCls} /></Field>
          </div>
          <Field label="Map link" htmlFor="event-map"><input id="event-map" value={data.mapsLink} onChange={(e) => set("mapsLink", e.target.value)} placeholder="https://maps.google.com/…" className={inputCls} /></Field>
        </>
      )}
      {data.locationType !== "PHYSICAL" && <p className="rounded-lg bg-[#FFF4F6] px-4 py-3 text-sm text-[#6E0C24]">Set the event-wide Join Live URL under Participation. A meeting time can override it.</p>}
    </div>
  );
}
