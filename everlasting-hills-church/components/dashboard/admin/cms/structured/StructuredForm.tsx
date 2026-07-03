"use client";

import { Plus, Trash2 } from "lucide-react";

/**
 * A generic, field-driven structured content form. Each designed page declares a
 * FieldDef[] (data, not UI) and this renders the editor — so adding a new
 * structured page is a field definition, not a bespoke component.
 */
export type FieldDef =
  | { kind: "text"; key: string; label: string; help?: string }
  | { kind: "textarea"; key: string; label: string; help?: string }
  | { kind: "list"; key: string; label: string; help?: string } // string[]
  | { kind: "group"; key: string; label: string; fields: FieldDef[] } // nested object
  | {
      kind: "repeat";
      key: string;
      label: string;
      itemLabel: string;
      fields: FieldDef[];
      fixed?: boolean; // no add/remove (e.g. fixed 5 pillars)
      max?: number;
    };

type Obj = Record<string, unknown>;

const inp =
  "w-full text-sm rounded-xl border border-[#E7CDD3] dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all placeholder:text-gray-400";

export default function StructuredForm({
  fields,
  value,
  onChange,
}: {
  fields: FieldDef[];
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const obj = (value ?? {}) as Obj;
  const set = (key: string, v: unknown) => onChange({ ...obj, [key]: v });

  return (
    <div className="space-y-6">
      {fields.map((f) => (
        <FieldView key={f.key} field={f} value={obj[f.key]} onChange={(v) => set(f.key, v)} />
      ))}
    </div>
  );
}

function FieldView({ field, value, onChange }: { field: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  if (field.kind === "text") {
    return (
      <Labeled label={field.label} help={field.help}>
        <input className={inp} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />
      </Labeled>
    );
  }
  if (field.kind === "textarea") {
    return (
      <Labeled label={field.label} help={field.help}>
        <textarea className={`${inp} min-h-[90px]`} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />
      </Labeled>
    );
  }
  if (field.kind === "list") {
    const items = Array.isArray(value) ? (value as string[]) : [];
    return (
      <Labeled label={field.label} help={field.help ?? "One per line"}>
        <textarea className={`${inp} min-h-[110px]`} value={items.join("\n")} onChange={(e) => onChange(e.target.value.split("\n"))} />
      </Labeled>
    );
  }
  if (field.kind === "group") {
    return (
      <div className="rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 bg-white dark:bg-[#140b10] p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#87102C] dark:text-[#e8768a] mb-3">{field.label}</p>
        <StructuredForm fields={field.fields} value={(value ?? {}) as Obj} onChange={onChange} />
      </div>
    );
  }
  // repeat
  const items = Array.isArray(value) ? (value as Obj[]) : [];
  const emptyItem = (): Obj => Object.fromEntries(field.fields.map((sf) => [sf.key, sf.kind === "list" ? [] : ""]));
  const setItem = (i: number, v: Obj) => onChange(items.map((it, idx) => (idx === i ? v : it)));
  return (
    <div className="rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 bg-[#FFF4F6]/30 dark:bg-white/[0.02] p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-[#87102C] dark:text-[#e8768a] mb-3">{field.label}</p>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-xl border border-[#E7CDD3]/60 dark:border-white/10 bg-white dark:bg-[#140b10] p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{field.itemLabel} {i + 1}</span>
              {!field.fixed && (
                <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="p-1 rounded text-gray-400 hover:text-red-600" aria-label="Remove"><Trash2 size={14} /></button>
              )}
            </div>
            <StructuredForm fields={field.fields} value={item} onChange={(v) => setItem(i, v as Obj)} />
          </div>
        ))}
        {!field.fixed && (!field.max || items.length < field.max) && (
          <button type="button" onClick={() => onChange([...items, emptyItem()])} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#87102C] dark:text-[#e8768a] hover:underline">
            <Plus size={14} /> Add {field.itemLabel.toLowerCase()}
          </button>
        )}
      </div>
    </div>
  );
}

function Labeled({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-white/50 mb-1.5">
        {label}
        {help && <span className="ml-2 font-normal text-gray-400 dark:text-white/30">{help}</span>}
      </label>
      {children}
    </div>
  );
}
