import Field from "./Field";
import { inputCls } from "./helpers";
import type { EventFormData, SetField } from "./useEventForm";

export default function EventFormSeoPublishing({ data, set, isEdit }: { data: EventFormData; set: SetField; isEdit: boolean }) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Field label="SEO title" htmlFor="event-seo-title"><input id="event-seo-title" value={data.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} placeholder={data.title || "Event title"} maxLength={120} className={inputCls} /></Field>
        <Field label="SEO description" htmlFor="event-seo-description"><textarea id="event-seo-description" rows={3} value={data.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} placeholder={data.shortDescription || "A concise description for search and sharing."} maxLength={320} className={`${inputCls} resize-y`} /></Field>
      </div>

      <div className="border-t border-gray-200 pt-5 dark:border-white/10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Status" htmlFor="event-status">
            <select id="event-status" value={data.status} onChange={(e) => set("status", e.target.value as EventFormData["status"])} className={inputCls}>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </Field>
          <Field label="Display order" htmlFor="event-order"><input id="event-order" type="number" value={data.order} onChange={(e) => set("order", Number(e.target.value) || 0)} className={inputCls} /></Field>
          <Field label="Slug" htmlFor="event-slug"><input id="event-slug" value={data.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto-from-title" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className={inputCls} /></Field>
        </div>
        <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-2.5">
          <input type="checkbox" checked={data.featured} onChange={(e) => set("featured", e.target.checked)} className="h-4 w-4 rounded accent-[#87102C]" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Feature this event on the homepage</span>
        </label>
        {isEdit && data.slug && data.status === "PUBLISHED" && <a href={`/events/${data.slug}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center rounded-lg border border-gray-200 px-4 text-sm font-semibold text-[#87102C] hover:bg-[#FFF4F6] dark:border-white/10">Open published page</a>}
        {data.status === "DRAFT" && <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">Drafts stay private. A signed preview flow is intentionally not exposed yet.</p>}
      </div>
    </div>
  );
}
