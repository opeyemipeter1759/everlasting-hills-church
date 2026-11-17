"use client";

import { Select } from "@/components/ui/select";
import { FRIEND_OR_FAMILY, HEARD_OTHER, HOW_DID_YOU_LEARN_OPTIONS } from "@/lib/first-timer/fields";
import { labelClass, inputClass, selectClass, type FormState, type SetField } from "./editVisitorForm";

const MESSAGES: Record<string, string> = {
  invitedBy: "Tell us who invited them",
  heardFromOther: "Tell us how they heard about us",
};

/** How they heard about the church, who invited them or how, and whether they are a student. */
export default function EditVisitorHeardFrom({
  form,
  set,
  errors,
}: {
  form: FormState;
  set: SetField;
  errors: Record<string, string>;
}) {
  const error = (key: string) =>
    errors[key] ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{MESSAGES[key] ?? errors[key]}</p> : null;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>How they heard about us</label>
          <Select
            aria-label="How they heard about us"
            value={form.howDidYouLearn}
            onChange={(v) => set("howDidYouLearn", v)}
            placeholder="Not set"
            className={selectClass}
            options={HOW_DID_YOU_LEARN_OPTIONS.map(({ value, label }) => ({ value, label }))}
          />
        </div>
        <div>
          <label className={labelClass}>Student</label>
          <Select
            aria-label="Student"
            value={form.isStudent}
            onChange={(v) => set("isStudent", v)}
            placeholder="Not answered"
            className={selectClass}
            options={[
              { value: "true", label: "Yes" },
              { value: "false", label: "No" },
            ]}
          />
        </div>
      </div>

      {form.howDidYouLearn === FRIEND_OR_FAMILY && (
        <div>
          <label className={labelClass}>Who invited them</label>
          <input value={form.invitedBy} onChange={(e) => set("invitedBy", e.target.value)} className={inputClass} />
          {error("invitedBy")}
        </div>
      )}
      {form.howDidYouLearn === HEARD_OTHER && (
        <div>
          <label className={labelClass}>How they heard about us, in their words</label>
          <input value={form.heardFromOther} onChange={(e) => set("heardFromOther", e.target.value)} className={inputClass} />
          {error("heardFromOther")}
        </div>
      )}
    </>
  );
}
