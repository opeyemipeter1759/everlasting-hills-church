"use client";

import { Combobox } from "@/components/ui/form/Combobox";
import { Select } from "@/components/ui/select";
import type { NextAction } from "@/lib/api/evangelism";
import { NEXT_ACTION_LABEL, SAVED_QUESTION, inputClass, labelClass, todayLagos } from "./labels";
import { OTHER_WORKER, type ContactFormErrors, type ContactFormState } from "./contact-form";

/**
 * The questions asked of someone preached to — the same on the public outreach
 * form and on the dashboard, so a record reads the same whichever way it came in.
 */
export function ContactFields({
  value,
  onChange,
  errors,
  workers,
  outreaches,
  workersLoading,
}: {
  value: ContactFormState;
  onChange: (next: ContactFormState) => void;
  errors: ContactFormErrors;
  workers: { id: string; name: string }[];
  outreaches: { id: string; name: string }[];
  workersLoading?: boolean;
}) {
  const set = <K extends keyof ContactFormState>(key: K, v: ContactFormState[K]) => onChange({ ...value, [key]: v });

  return (
    <div className="space-y-4">
      <Field label="Name of the person preached to" required error={errors.name}>
        <input
          className={inputClass}
          value={value.name}
          onChange={(e) => set("name", e.target.value)}
          autoComplete="off"
          maxLength={120}
          placeholder="Full name"
        />
      </Field>

      <Field label="Phone number" required error={errors.phone} hint="080…, 070…, 090… or +234…">
        <input
          className={inputClass}
          value={value.phone}
          onChange={(e) => set("phone", e.target.value)}
          type="tel"
          inputMode="tel"
          autoComplete="off"
          maxLength={24}
          placeholder="0803 123 4567"
        />
      </Field>

      <Field label="Address" required error={errors.address}>
        <input
          className={inputClass}
          value={value.address}
          onChange={(e) => set("address", e.target.value)}
          autoComplete="off"
          maxLength={300}
          placeholder="Street, area"
        />
      </Field>

      <Field label="Did they give their life to Christ?" required error={errors.savedStatus}>
        <Choice
          name="savedStatus"
          options={SAVED_QUESTION}
          value={value.savedStatus}
          onChange={(v) => set("savedStatus", v)}
        />
      </Field>

      <Field label="Are they a student?" required error={errors.isStudent}>
        <Choice
          name="isStudent"
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          value={value.isStudent}
          onChange={(v) => set("isStudent", v)}
        />
      </Field>

      {value.isStudent === "yes" && (
        <div className="grid gap-4 rounded-2xl bg-gray-50 p-3 dark:bg-white/[0.03] sm:grid-cols-2">
          <Field label="School name" required error={errors.school}>
            <input className={inputClass} value={value.school} onChange={(e) => set("school", e.target.value)} maxLength={160} />
          </Field>
          <Field label="Level / class" error={errors.level}>
            <input
              className={inputClass}
              value={value.level}
              onChange={(e) => set("level", e.target.value)}
              maxLength={60}
              placeholder="e.g. SS2, 200 Level"
            />
          </Field>
        </div>
      )}

      <Field label="Brief discussion" hint="What was discussed, their response, prayer requests, needs">
        <textarea
          className={`${inputClass} min-h-[96px] resize-y`}
          value={value.discussion}
          onChange={(e) => set("discussion", e.target.value)}
          maxLength={4000}
        />
      </Field>

      <Field label="Worker who preached to them" required error={errors.workerId}>
        <Combobox
          options={[...workers.map((w) => ({ id: w.id, label: w.name })), { id: OTHER_WORKER, label: "Other (type a name)" }]}
          value={value.workerId}
          onChange={(id) => set("workerId", id)}
          placeholder="Choose your name"
          searchPlaceholder="Search the team…"
          loading={workersLoading}
        />
      </Field>
      {value.workerId === OTHER_WORKER && (
        <Field label="Worker's name" required error={errors.workerOther}>
          <input
            className={inputClass}
            value={value.workerOther}
            onChange={(e) => set("workerOther", e.target.value)}
            maxLength={120}
          />
        </Field>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Outreach">
          <Select
            aria-label="Outreach"
            value={value.outreachId}
            onChange={(v) => set("outreachId", v)}
            options={[{ value: "", label: "Personal evangelism" }, ...outreaches.map((o) => ({ value: o.id, label: o.name }))]}
          />
        </Field>
        <Field label="Date of contact" required error={errors.contactDate}>
          <input
            className={inputClass}
            type="date"
            value={value.contactDate}
            max={todayLagos()}
            onChange={(e) => set("contactDate", e.target.value)}
          />
        </Field>
      </div>

      <Field label="Next action needed">
        <Select
          aria-label="Next action needed"
          value={value.nextAction}
          onChange={(v) => set("nextAction", v as NextAction | "")}
          options={[
            { value: "", label: "Choose…" },
            ...(Object.keys(NEXT_ACTION_LABEL) as NextAction[]).map((k) => ({ value: k, label: NEXT_ACTION_LABEL[k] })),
          ]}
        />
      </Field>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-200 p-3 text-sm text-gray-700 dark:border-white/10 dark:text-white/80">
        <input
          type="checkbox"
          checked={value.consent}
          onChange={(e) => set("consent", e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[#87102C]"
        />
        <span>The person agreed to be contacted by the church</span>
      </label>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className={labelClass}>
        {label}
        {required && <span className="text-[#87102C] dark:text-[#FFB3C1]"> *</span>}
      </span>
      {children}
      {error ? (
        <p role="alert" className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-[11px] text-gray-400 dark:text-white/40">{hint}</p>
      ) : null}
    </div>
  );
}

function Choice<V extends string>({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: { value: V; label: string }[];
  value: V | "";
  onChange: (v: V) => void;
}) {
  return (
    <div role="radiogroup" className="flex flex-wrap gap-2">
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <label
            key={o.value}
            className={`flex min-h-11 cursor-pointer items-center rounded-xl border px-4 text-sm font-semibold transition-colors ${
              selected
                ? "border-[#87102C] bg-[#87102C] text-white"
                : "border-gray-200 text-gray-700 hover:border-[#87102C]/40 dark:border-white/10 dark:text-white/80"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={selected}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        );
      })}
    </div>
  );
}
