import Field from "./Field";
import { inputCls } from "./helpers";
import type { EventFormData, SetField } from "./useEventForm";

export default function EventFormPeopleContact({ data, set }: { data: EventFormData; set: SetField }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Host">
          <input
            value={data.hostName}
            onChange={(e) => set("hostName", e.target.value)}
            placeholder="Pastor Bowale Okunola"
            className={inputCls}
          />
        </Field>
        <Field label="Guest minister">
          <input
            value={data.guestMinister}
            onChange={(e) => set("guestMinister", e.target.value)}
            placeholder="TBA"
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Contact phone">
          <input
            value={data.contactPhone}
            onChange={(e) => set("contactPhone", e.target.value)}
            placeholder="+234…"
            className={inputCls}
          />
        </Field>
        <Field label="Contact email">
          <input
            type="email"
            value={data.contactEmail}
            onChange={(e) => set("contactEmail", e.target.value)}
            placeholder="events@…"
            className={inputCls}
          />
        </Field>
        <Field label="WhatsApp link">
          <input
            value={data.contactWhatsapp}
            onChange={(e) => set("contactWhatsapp", e.target.value)}
            placeholder="https://wa.me/…"
            className={inputCls}
          />
        </Field>
      </div>
    </>
  );
}
