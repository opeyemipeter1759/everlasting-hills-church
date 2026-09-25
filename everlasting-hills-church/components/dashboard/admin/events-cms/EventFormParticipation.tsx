import Field from "./Field";
import { inputCls } from "./helpers";
import type { EventFormData, SetField } from "./useEventForm";

export default function EventFormParticipation({ data, set }: { data: EventFormData; set: SetField }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-6 rounded-xl border border-gray-200 p-4 dark:border-white/10">
        <label className="flex min-h-11 cursor-pointer items-center gap-2.5">
          <input type="checkbox" checked={data.registrationRequired} onChange={(e) => set("registrationRequired", e.target.checked)} className="h-4 w-4 rounded accent-[#87102C]" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Registration is required</span>
        </label>
        {data.registrationRequired && (
          <label className="flex min-h-11 cursor-pointer items-center gap-2.5">
            <input type="checkbox" checked={data.rsvpEnabled} onChange={(e) => set("rsvpEnabled", e.target.checked)} className="h-4 w-4 rounded accent-[#87102C]" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Use the built-in RSVP form</span>
          </label>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Join Live URL" htmlFor="event-live-url"><input id="event-live-url" type="url" value={data.liveUrl} onChange={(e) => set("liveUrl", e.target.value)} placeholder="Add when available" className={inputCls} /></Field>
        {data.registrationRequired && !data.rsvpEnabled && <Field label="External registration URL" htmlFor="event-registration-url"><input id="event-registration-url" type="url" value={data.registrationUrl} onChange={(e) => set("registrationUrl", e.target.value)} placeholder="https://…" className={inputCls} /></Field>}
        <Field label="Testimony form URL" htmlFor="event-testimony-url"><input id="event-testimony-url" value={data.testimonyUrl} onChange={(e) => set("testimonyUrl", e.target.value)} placeholder="/testimony or https://…" className={inputCls} /></Field>
        <Field label="Capacity (built-in RSVP only)" htmlFor="event-capacity"><input id="event-capacity" type="number" min={1} value={data.capacity} onChange={(e) => set("capacity", e.target.value)} placeholder="No limit" className={inputCls} /></Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Primary action label" htmlFor="event-primary-label"><input id="event-primary-label" value={data.primaryCtaLabel} onChange={(e) => set("primaryCtaLabel", e.target.value)} placeholder="Join Live" className={inputCls} /></Field>
        <Field label="Primary action URL" htmlFor="event-primary-url"><input id="event-primary-url" value={data.primaryCtaUrl} onChange={(e) => set("primaryCtaUrl", e.target.value)} placeholder="Defaults to Join Live or registration" className={inputCls} /></Field>
        <Field label="Secondary action label" htmlFor="event-secondary-label"><input id="event-secondary-label" value={data.secondaryCtaLabel} onChange={(e) => set("secondaryCtaLabel", e.target.value)} placeholder="Learn more" className={inputCls} /></Field>
        <Field label="Secondary action URL" htmlFor="event-secondary-url"><input id="event-secondary-url" value={data.secondaryCtaUrl} onChange={(e) => set("secondaryCtaUrl", e.target.value)} placeholder="/about or https://…" className={inputCls} /></Field>
      </div>

      <details className="rounded-xl border border-gray-200 p-4 dark:border-white/10">
        <summary className="cursor-pointer text-xs font-bold text-gray-600 dark:text-gray-300">Host and contact details</summary>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Host" htmlFor="event-host"><input id="event-host" value={data.hostName} onChange={(e) => set("hostName", e.target.value)} className={inputCls} /></Field>
          <Field label="Guest minister" htmlFor="event-guest"><input id="event-guest" value={data.guestMinister} onChange={(e) => set("guestMinister", e.target.value)} className={inputCls} /></Field>
          <Field label="Contact phone" htmlFor="event-phone"><input id="event-phone" value={data.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} className={inputCls} /></Field>
          <Field label="Contact email" htmlFor="event-email"><input id="event-email" type="email" value={data.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} className={inputCls} /></Field>
          <Field label="WhatsApp link" htmlFor="event-whatsapp"><input id="event-whatsapp" value={data.contactWhatsapp} onChange={(e) => set("contactWhatsapp", e.target.value)} className={inputCls} /></Field>
        </div>
      </details>
    </div>
  );
}
