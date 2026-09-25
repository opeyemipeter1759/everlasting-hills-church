import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { EventSection, EventSectionType } from "@/types";
import Field from "./Field";
import { inputCls } from "./helpers";
import type { EventFormData, SetField } from "./useEventForm";

const sectionOptions: { value: EventSectionType; label: string }[] = [
  { value: "RICH_TEXT", label: "Rich text" },
  { value: "SCHEDULE", label: "Schedule presentation" },
  { value: "EXPECTATIONS", label: "Expectations" },
  { value: "PRAYER_FOCUS", label: "Prayer focus" },
  { value: "FAQ", label: "Frequently asked questions" },
  { value: "TESTIMONY", label: "Testimony call to action" },
  { value: "CTA", label: "Call to action" },
];

function base<T extends EventSectionType>(type: T) {
  return {
    id: `new-${Date.now()}-${Math.random()}`,
    eventId: "",
    type,
    title: null,
    subtitle: null,
    sortOrder: 0,
    isVisible: true,
    version: 1,
  } as const;
}

function newSection(type: EventSectionType): EventSection {
  switch (type) {
    case "RICH_TEXT": return { ...base(type), content: { body: "" } };
    case "SCHEDULE": return { ...base(type), content: { introduction: "", tags: [] } };
    case "EXPECTATIONS": return { ...base(type), content: { introduction: "", items: [{ title: "", description: "" }] } };
    case "PRAYER_FOCUS": return { ...base(type), content: { focuses: [] } };
    case "FAQ": return { ...base(type), content: { items: [{ question: "", answer: "" }] } };
    case "TESTIMONY": return { ...base(type), content: { body: "", buttonLabel: "Share your testimony", url: "" } };
    case "CTA": return { ...base(type), content: { body: "", buttonLabel: "Learn more", url: "" } };
  }
}

export default function EventFormSections({ data, set }: { data: EventFormData; set: SetField }) {
  const [addType, setAddType] = useState<EventSectionType>("RICH_TEXT");

  function update(index: number, section: EventSection) {
    set("sections", data.sections.map((item, i) => (i === index ? section : item)));
  }
  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= data.sections.length) return;
    const next = [...data.sections];
    [next[index], next[target]] = [next[target], next[index]];
    set("sections", next);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl bg-gray-50 p-4 dark:bg-white/[0.03] sm:flex-row sm:items-end">
        <div className="flex-1">
          <Field label="Section type" htmlFor="new-section-type">
            <select id="new-section-type" value={addType} onChange={(e) => setAddType(e.target.value as EventSectionType)} className={inputCls}>
              {sectionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>
        </div>
        <button type="button" onClick={() => set("sections", [...data.sections, newSection(addType)])} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#87102C] px-4 text-sm font-bold text-white hover:bg-[#6E0C24]"><Plus size={15} /> Add section</button>
      </div>

      {data.sections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-5 py-8 text-center dark:border-white/15">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">This is currently a simple event.</p>
          <p className="mt-1 text-xs text-gray-500">Add only the content sections this event needs.</p>
        </div>
      ) : data.sections.map((section, index) => (
        <details key={section.id} open={index === 0} className="group rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.02]">
          <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 marker:hidden">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF4F6] text-xs font-black text-[#87102C]">{index + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-gray-900 dark:text-white">{section.title || sectionOptions.find((item) => item.value === section.type)?.label}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{section.type.replaceAll("_", " ")}{section.isVisible ? "" : " · Hidden"}</span>
            </span>
          </summary>
          <div className="space-y-4 border-t border-gray-200 p-4 dark:border-white/10">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Section heading" htmlFor={`section-title-${index}`}><input id={`section-title-${index}`} value={section.title ?? ""} onChange={(e) => update(index, { ...section, title: e.target.value || null })} className={inputCls} /></Field>
              <Field label="Optional eyebrow / subtitle" htmlFor={`section-subtitle-${index}`}><input id={`section-subtitle-${index}`} value={section.subtitle ?? ""} onChange={(e) => update(index, { ...section, subtitle: e.target.value || null })} className={inputCls} /></Field>
            </div>
            <SectionEditor section={section} index={index} update={(next) => update(index, next)} />
            <div className="flex flex-wrap justify-end gap-1 border-t border-gray-100 pt-3 dark:border-white/5">
              <button type="button" onClick={() => update(index, { ...section, isVisible: !section.isVisible })} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs font-bold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5">{section.isVisible ? <EyeOff size={14} /> : <Eye size={14} />}{section.isVisible ? "Hide" : "Show"}</button>
              <button type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`Move section ${index + 1} up`} className="min-h-11 min-w-11 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-white/5"><ArrowUp size={15} className="mx-auto" /></button>
              <button type="button" disabled={index === data.sections.length - 1} onClick={() => move(index, 1)} aria-label={`Move section ${index + 1} down`} className="min-h-11 min-w-11 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-white/5"><ArrowDown size={15} className="mx-auto" /></button>
              <button type="button" onClick={() => set("sections", data.sections.filter((_, i) => i !== index))} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 size={14} /> Delete</button>
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}

function SectionEditor({ section, index, update }: { section: EventSection; index: number; update: (section: EventSection) => void }) {
  switch (section.type) {
    case "RICH_TEXT":
      return <Field label="Body" htmlFor={`section-body-${index}`}><textarea id={`section-body-${index}`} required rows={7} value={section.content.body} onChange={(e) => update({ ...section, content: { body: e.target.value } })} placeholder="Write the event overview. Plain text and line breaks are rendered safely." className={`${inputCls} resize-y`} /></Field>;
    case "SCHEDULE":
      return <div className="space-y-4"><Field label="Introduction" htmlFor={`section-intro-${index}`}><textarea id={`section-intro-${index}`} rows={3} value={section.content.introduction ?? ""} onChange={(e) => update({ ...section, content: { ...section.content, introduction: e.target.value } })} className={`${inputCls} resize-y`} /></Field><StringListEditor label="Rhythm tags" values={section.content.tags} onChange={(tags) => update({ ...section, content: { ...section.content, tags } })} placeholder="Prayer" /></div>;
    case "EXPECTATIONS":
      return <div className="space-y-4"><Field label="Introduction" htmlFor={`section-intro-${index}`}><textarea id={`section-intro-${index}`} rows={3} value={section.content.introduction ?? ""} onChange={(e) => update({ ...section, content: { ...section.content, introduction: e.target.value } })} className={`${inputCls} resize-y`} /></Field>{section.content.items.map((item, itemIndex) => <div key={itemIndex} className="rounded-lg bg-gray-50 p-3 dark:bg-white/[0.03]"><div className="grid gap-3 sm:grid-cols-2"><input aria-label={`Expectation ${itemIndex + 1} title`} value={item.title} onChange={(e) => { const items = section.content.items.map((old, i) => i === itemIndex ? { ...old, title: e.target.value } : old); update({ ...section, content: { ...section.content, items } }); }} placeholder="Expectation title" className={inputCls} /><input aria-label={`Expectation ${itemIndex + 1} scripture`} value={item.scripture ?? ""} onChange={(e) => { const items = section.content.items.map((old, i) => i === itemIndex ? { ...old, scripture: e.target.value } : old); update({ ...section, content: { ...section.content, items } }); }} placeholder="Optional scripture" className={inputCls} /></div><textarea aria-label={`Expectation ${itemIndex + 1} description`} rows={3} value={item.description} onChange={(e) => { const items = section.content.items.map((old, i) => i === itemIndex ? { ...old, description: e.target.value } : old); update({ ...section, content: { ...section.content, items } }); }} placeholder="Description" className={`${inputCls} mt-3 resize-y`} /><RemoveButton label="Remove expectation" onClick={() => update({ ...section, content: { ...section.content, items: section.content.items.filter((_, i) => i !== itemIndex) } })} /></div>)}<AddButton label="Add expectation" onClick={() => update({ ...section, content: { ...section.content, items: [...section.content.items, { title: "", description: "" }] } })} /></div>;
    case "FAQ":
      return <div className="space-y-3">{section.content.items.map((item, itemIndex) => <div key={itemIndex} className="rounded-lg bg-gray-50 p-3 dark:bg-white/[0.03]"><input aria-label={`Question ${itemIndex + 1}`} value={item.question} onChange={(e) => { const items = section.content.items.map((old, i) => i === itemIndex ? { ...old, question: e.target.value } : old); update({ ...section, content: { items } }); }} placeholder="Question" className={inputCls} /><textarea aria-label={`Answer ${itemIndex + 1}`} rows={3} value={item.answer} onChange={(e) => { const items = section.content.items.map((old, i) => i === itemIndex ? { ...old, answer: e.target.value } : old); update({ ...section, content: { items } }); }} placeholder="Answer" className={`${inputCls} mt-3 resize-y`} /><RemoveButton label="Remove question" onClick={() => update({ ...section, content: { items: section.content.items.filter((_, i) => i !== itemIndex) } })} /></div>)}<AddButton label="Add question" onClick={() => update({ ...section, content: { items: [...section.content.items, { question: "", answer: "" }] } })} /></div>;
    case "PRAYER_FOCUS":
      return <div className="space-y-4">{section.content.focuses.map((focus, focusIndex) => <div key={focusIndex} className="space-y-3 rounded-lg bg-gray-50 p-3 dark:bg-white/[0.03]"><div className="grid gap-3 sm:grid-cols-2"><input aria-label={`Prayer focus ${focusIndex + 1} title`} value={focus.title} onChange={(e) => { const focuses = section.content.focuses.map((old, i) => i === focusIndex ? { ...old, title: e.target.value } : old); update({ ...section, content: { focuses } }); }} placeholder="Spiritual Restoration" className={inputCls} /><input aria-label={`Prayer focus ${focusIndex + 1} day or date`} value={focus.dayDate ?? ""} onChange={(e) => { const focuses = section.content.focuses.map((old, i) => i === focusIndex ? { ...old, dayDate: e.target.value } : old); update({ ...section, content: { focuses } }); }} placeholder="Optional day / date" className={inputCls} /></div><textarea aria-label={`Prayer focus ${focusIndex + 1} introduction`} rows={2} value={focus.introduction ?? ""} onChange={(e) => { const focuses = section.content.focuses.map((old, i) => i === focusIndex ? { ...old, introduction: e.target.value } : old); update({ ...section, content: { focuses } }); }} placeholder="Introduction" className={`${inputCls} resize-y`} /><StringListEditor label="Scriptures" values={focus.scriptures} onChange={(scriptures) => { const focuses = section.content.focuses.map((old, i) => i === focusIndex ? { ...old, scriptures } : old); update({ ...section, content: { focuses } }); }} placeholder="Romans 12:11" /><StringListEditor label="Prayer points" values={focus.prayerPoints} onChange={(prayerPoints) => { const focuses = section.content.focuses.map((old, i) => i === focusIndex ? { ...old, prayerPoints } : old); update({ ...section, content: { focuses } }); }} placeholder="Pray for renewed hunger for God" /><textarea aria-label={`Prayer focus ${focusIndex + 1} declaration`} rows={2} value={focus.declaration ?? ""} onChange={(e) => { const focuses = section.content.focuses.map((old, i) => i === focusIndex ? { ...old, declaration: e.target.value } : old); update({ ...section, content: { focuses } }); }} placeholder="Optional declaration" className={`${inputCls} resize-y`} /><RemoveButton label="Remove prayer focus" onClick={() => update({ ...section, content: { focuses: section.content.focuses.filter((_, i) => i !== focusIndex) } })} /></div>)}<AddButton label="Add prayer focus" onClick={() => update({ ...section, content: { focuses: [...section.content.focuses, { title: "", introduction: "", scriptures: [], prayerPoints: [], declaration: "", dayDate: "" }] } })} /></div>;
    case "TESTIMONY":
      return <div className="space-y-3"><Field label="Description" htmlFor={`section-cta-body-${index}`}><textarea id={`section-cta-body-${index}`} rows={4} value={section.content.body} onChange={(e) => update({ ...section, content: { ...section.content, body: e.target.value } })} className={`${inputCls} resize-y`} /></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="Button label" htmlFor={`section-cta-label-${index}`}><input id={`section-cta-label-${index}`} required value={section.content.buttonLabel} onChange={(e) => update({ ...section, content: { ...section.content, buttonLabel: e.target.value } })} className={inputCls} /></Field><Field label="Destination URL" htmlFor={`section-cta-url-${index}`}><input id={`section-cta-url-${index}`} value={section.content.url ?? ""} onChange={(e) => update({ ...section, content: { ...section.content, url: e.target.value } })} placeholder="Add when available" className={inputCls} /></Field></div></div>;
    case "CTA":
      return <div className="space-y-3"><Field label="Description" htmlFor={`section-cta-body-${index}`}><textarea id={`section-cta-body-${index}`} rows={4} value={section.content.body ?? ""} onChange={(e) => update({ ...section, content: { ...section.content, body: e.target.value } })} className={`${inputCls} resize-y`} /></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="Button label" htmlFor={`section-cta-label-${index}`}><input id={`section-cta-label-${index}`} required value={section.content.buttonLabel} onChange={(e) => update({ ...section, content: { ...section.content, buttonLabel: e.target.value } })} className={inputCls} /></Field><Field label="Destination URL" htmlFor={`section-cta-url-${index}`}><input id={`section-cta-url-${index}`} value={section.content.url ?? ""} onChange={(e) => update({ ...section, content: { ...section.content, url: e.target.value } })} placeholder="Add when available" className={inputCls} /></Field></div></div>;
  }
}

function StringListEditor({ label, values, onChange, placeholder }: { label: string; values: string[]; onChange: (values: string[]) => void; placeholder: string }) {
  return <div><p className="mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</p><div className="space-y-2">{values.map((value, index) => <div key={index} className="flex gap-2"><input aria-label={`${label} ${index + 1}`} value={value} onChange={(e) => onChange(values.map((old, i) => i === index ? e.target.value : old))} placeholder={placeholder} className={inputCls} /><button type="button" onClick={() => onChange(values.filter((_, i) => i !== index))} aria-label={`Remove ${label.toLowerCase()} ${index + 1}`} className="min-h-11 min-w-11 rounded-lg text-red-600 hover:bg-red-50"><Trash2 size={14} className="mx-auto" /></button></div>)}</div><button type="button" onClick={() => onChange([...values, ""])} className="mt-2 text-xs font-bold text-[#87102C]">+ Add {label.toLowerCase()}</button></div>;
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-200 px-3 text-xs font-bold text-[#87102C] hover:bg-[#FFF4F6] dark:border-white/10"><Plus size={14} /> {label}</button>;
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 size={13} /> {label}</button>;
}
