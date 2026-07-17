import Field from "./Field";
import { inputCls } from "./helpers";
import type { EventFormData, SetField } from "./useEventForm";
import { Select } from "@/components/ui/select";

export default function EventFormSettings({ data, set }: { data: EventFormData; set: SetField }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Status">
          <Select
            aria-label="Status"
            value={data.status}
            onChange={(v) => set("status", v as "DRAFT" | "PUBLISHED")}
            className={inputCls}
            options={[
              { value: "DRAFT", label: "Draft" },
              { value: "PUBLISHED", label: "Published" },
            ]}
          />
        </Field>
        <Field label="Capacity (optional)">
          <input
            type="number"
            min={1}
            value={data.capacity}
            onChange={(e) => set("capacity", e.target.value)}
            placeholder="No limit"
            className={inputCls}
          />
        </Field>
        <Field label="Display order">
          <input
            type="number"
            value={data.order}
            onChange={(e) => set("order", Number(e.target.value) || 0)}
            className={inputCls}
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={data.featured}
            onChange={(e) => set("featured", e.target.checked)}
            className="w-4 h-4 rounded accent-[#87102C]"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Feature this event</span>
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={data.rsvpEnabled}
            onChange={(e) => set("rsvpEnabled", e.target.checked)}
            className="w-4 h-4 rounded accent-[#87102C]"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Allow RSVPs</span>
        </label>
      </div>

      <details className="rounded-lg border border-gray-200 dark:border-white/10 p-3">
        <summary className="text-xs font-semibold text-gray-500 dark:text-gray-400 cursor-pointer">
          Advanced
        </summary>
        <div className="mt-3">
          <Field label="Slug (auto from title if blank)">
            <input
              value={data.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="heaven-on-earth"
              className={inputCls}
            />
            <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-1.5">
              The event opens at <span className="font-mono">/events/{data.slug || "your-slug"}</span>.
            </p>
          </Field>
        </div>
      </details>
    </>
  );
}
