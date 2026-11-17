"use client";

import { useRef, useState } from "react";
import { TEMPLATE_VARIABLES, VARIABLE_HINT, WHATSAPP_MAX, longestWhatsApp, type TemplateDraft } from "@/lib/messages/opening-template";

type Field = keyof TemplateDraft;

const LABEL = "mb-1.5 block text-sm font-semibold text-gray-800 dark:text-white/85";
const INPUT =
  "w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-base text-gray-900 placeholder:text-gray-400 focus:border-[#87102C]/50 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 dark:border-white/15 dark:bg-white/5 dark:text-white sm:text-sm";

/**
 * The three parts of the opening message, with one-tap placeholders that drop
 * in where the cursor is, and a count of how long the WhatsApp message can get
 * once names are filled in.
 */
export function TemplateFields({
  draft,
  onChange,
  church,
}: {
  draft: TemplateDraft;
  onChange: (next: TemplateDraft) => void;
  church: { churchName: string; serviceTimes: string };
}) {
  const refs = useRef<Partial<Record<Field, HTMLTextAreaElement | HTMLInputElement | null>>>({});
  const [focused, setFocused] = useState<Field>("whatsappBody");
  const longest = longestWhatsApp(draft.whatsappBody, church);

  function insert(name: string) {
    const token = `{{${name}}}`;
    const el = refs.current[focused];
    const value = draft[focused];
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    onChange({ ...draft, [focused]: value.slice(0, start) + token + value.slice(end) });
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + token.length, start + token.length);
    });
  }

  const bind = (field: Field) => ({
    id: `template-${field}`,
    value: draft[field],
    onFocus: () => setFocused(field),
    onChange: (e: { target: { value: string } }) => onChange({ ...draft, [field]: e.target.value }),
  });

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-gray-800 dark:text-white/85">Fill-ins</p>
        <p className="text-xs text-gray-500 dark:text-white/45">Tap one to add it where your cursor is. Each is filled in for the person you send to.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TEMPLATE_VARIABLES.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => insert(v)}
              title={VARIABLE_HINT[v]}
              className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:border-[#87102C]/30 hover:bg-[#FFF4F6] dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10"
            >
              {VARIABLE_HINT[v]} <span className="font-mono text-[11px] text-gray-500 dark:text-white/45">{`{{${v}}}`}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="template-whatsappBody" className={LABEL}>WhatsApp message</label>
        <textarea {...bind("whatsappBody")} ref={(el) => { refs.current.whatsappBody = el; }} rows={9} className={INPUT} placeholder="Hello {{firstName}}, this is {{contactName}} from {{churchName}}..." />
        <p className={`mt-1 text-xs ${longest > WHATSAPP_MAX ? "font-semibold text-red-600 dark:text-red-400" : "text-gray-500 dark:text-white/45"}`}>
          Up to {longest.toLocaleString("en-GB")} of {WHATSAPP_MAX.toLocaleString("en-GB")} characters once names are filled in
        </p>
      </div>

      <div>
        <label htmlFor="template-emailSubject" className={LABEL}>Email subject</label>
        <input {...bind("emailSubject")} ref={(el) => { refs.current.emailSubject = el; }} className={INPUT} placeholder="So glad you came, {{firstName}}" />
      </div>

      <div>
        <label htmlFor="template-emailBody" className={LABEL}>Email message</label>
        <textarea {...bind("emailBody")} ref={(el) => { refs.current.emailBody = el; }} rows={12} className={INPUT} placeholder="Hello {{firstName}}," />
        <p className="mt-1 text-xs text-gray-500 dark:text-white/45">Leave a blank line between paragraphs. It goes out in the church&apos;s email design.</p>
      </div>
    </div>
  );
}
