"use client";

import { useState } from "react";
import { Select } from "@/components/ui/select";
import type { DocumentsConfig } from "@/lib/api/marriage-documents";
import { STATUS_LABEL } from "@/lib/pre-marital/schema";
import { card, input, selectBox } from "../ui";

export type FieldSpec = { key: keyof DocumentsConfig; label: string; hint: string; kind: "lines" | "number" | "labs" | "text" | "bool" | "status" | "reasons" };
type Entry = DocumentsConfig[keyof DocumentsConfig];

const GATE = (["ACCEPTED_FOR_COUNSELLING", "IN_COUNSELLING", "FINAL_REVIEW", "COMPLETED"] as const).map((s) => ({ value: s, label: STATUS_LABEL[s] }));

type Lab = { name: string; address: string; phone: string };
type Reason = { code: string; label: string };
const toText = (kind: FieldSpec["kind"], value: unknown) =>
  kind === "lines"
    ? (value as string[]).join("\n")
    : kind === "labs"
      ? (value as Lab[]).map((l) => [l.name, l.address, l.phone].join(" | ")).join("\n")
      : (value as Reason[]).map((r) => `${r.code} | ${r.label}`).join("\n");
const fromText = (kind: FieldSpec["kind"], text: string): unknown => {
  const rows = text.split("\n").map((r) => r.trim()).filter(Boolean);
  if (kind === "lines") return rows;
  if (kind === "labs")
    return rows.map((r) => {
      const [name = "", address = "", phone = ""] = r.split("|").map((p) => p.trim());
      return { name, address, phone };
    });
  return rows.map((r) => {
    const [code = "", label = ""] = r.split("|").map((p) => p.trim());
    return { code: code.toUpperCase(), label };
  });
};

/** One documents setting with its Approved box. */
export function SettingField({ spec, entry, disabled, onChange }: { spec: FieldSpec; entry: Entry; disabled: boolean; onChange: (e: Entry) => void }) {
  const id = `docset-${spec.key}`;
  const listy = spec.kind === "lines" || spec.kind === "labs" || spec.kind === "reasons";
  const [text, setText] = useState(() => (listy ? toText(spec.kind, entry.value) : ""));
  const set = (value: unknown) => onChange({ ...entry, value } as Entry);

  return (
    <fieldset className={card} disabled={disabled}>
      <legend className="sr-only">{spec.label}</legend>
      {spec.kind === "bool" ? (
        <label className="flex min-h-10 items-center gap-2 text-sm font-semibold text-[#111] dark:text-white/90">
          <input id={id} type="checkbox" className="h-5 w-5 accent-[#87102C]" checked={entry.value as boolean} onChange={(e) => set(e.target.checked)} />
          {spec.label}
        </label>
      ) : (
        <label htmlFor={id} className="block text-sm font-semibold text-[#111] dark:text-white/90">{spec.label}</label>
      )}
      {spec.hint && <p className="text-xs text-gray-600 dark:text-white/55">{spec.hint}</p>}
      {spec.kind === "number" && <input id={id} type="number" min={1} value={entry.value as number} onChange={(e) => set(Number(e.target.value))} className={`${input} mt-2 w-32`} />}
      {spec.kind === "text" && <textarea id={id} rows={3} maxLength={2000} value={entry.value as string} onChange={(e) => set(e.target.value)} className={`${input} mt-2 py-2`} />}
      {listy && (
        <textarea
          id={id}
          rows={4}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            set(fromText(spec.kind, e.target.value));
          }}
          className={`${input} mt-2 py-2`}
        />
      )}
      {spec.kind === "status" && (
        <div className="mt-2 max-w-xs">
          <Select value={entry.value as string} onChange={(v) => set(v)} options={GATE} aria-label={spec.label} className={selectBox} />
        </div>
      )}
      <label className="mt-2 flex min-h-10 items-center gap-2 text-sm text-[#111] dark:text-white/85">
        <input
          type="checkbox"
          className="h-5 w-5 accent-[#87102C]"
          checked={entry.state === "APPROVED"}
          onChange={(e) => onChange({ ...entry, state: e.target.checked ? "APPROVED" : "PENDING_PASTORAL_APPROVAL" } as Entry)}
        />
        Approved
      </label>
    </fieldset>
  );
}
