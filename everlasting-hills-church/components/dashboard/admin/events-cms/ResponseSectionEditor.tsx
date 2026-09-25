"use client";

import { Plus, Trash2 } from "lucide-react";
import type { EventSection } from "@/types";
import Field from "./Field";
import { inputCls } from "./helpers";

type ResponseSection = Extract<EventSection, { type: "RESPONSE" }>;
type ResponseAction = ResponseSection["content"]["actions"][number];

export const EMPTY_RESPONSE_ACTION: ResponseAction = {
  heading: "",
  body: "",
  buttonLabel: "",
  url: "",
  note: "",
};

/**
 * Editor for a "ways to respond" section — several actions shown side by side
 * on the event page, such as a testimony form next to a salvation form.
 *
 * `note` exists so an admin can say what somebody is agreeing to before they
 * open the form, rather than leaving the first mention of it inside the form.
 */
export default function ResponseSectionEditor({
  section,
  index,
  update,
}: {
  section: ResponseSection;
  index: number;
  update: (section: EventSection) => void;
}) {
  const setActions = (actions: ResponseAction[]) =>
    update({ ...section, content: { ...section.content, actions } });

  const patch = (actionIndex: number, key: keyof ResponseAction, value: string) =>
    setActions(
      section.content.actions.map((old, i) => (i === actionIndex ? { ...old, [key]: value } : old)),
    );

  return (
    <div className="space-y-4">
      <Field label="Introduction" htmlFor={`section-response-intro-${index}`}>
        <textarea
          id={`section-response-intro-${index}`}
          rows={2}
          value={section.content.introduction ?? ""}
          onChange={(e) => update({ ...section, content: { ...section.content, introduction: e.target.value } })}
          placeholder="One line above the cards."
          className={`${inputCls} resize-y`}
        />
      </Field>

      {section.content.actions.map((action, actionIndex) => (
        <div key={actionIndex} className="space-y-3 rounded-lg bg-gray-50 p-3 dark:bg-white/[0.03]">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              aria-label={`Response ${actionIndex + 1} heading`}
              value={action.heading}
              onChange={(e) => patch(actionIndex, "heading", e.target.value)}
              placeholder="Have a testimony?"
              className={inputCls}
            />
            <input
              aria-label={`Response ${actionIndex + 1} button label`}
              value={action.buttonLabel}
              onChange={(e) => patch(actionIndex, "buttonLabel", e.target.value)}
              placeholder="Share your testimony"
              className={inputCls}
            />
          </div>
          <textarea
            aria-label={`Response ${actionIndex + 1} description`}
            rows={3}
            value={action.body ?? ""}
            onChange={(e) => patch(actionIndex, "body", e.target.value)}
            placeholder="What this is for."
            className={`${inputCls} resize-y`}
          />
          <input
            aria-label={`Response ${actionIndex + 1} destination URL`}
            value={action.url ?? ""}
            onChange={(e) => patch(actionIndex, "url", e.target.value)}
            placeholder="Form link — the card says 'coming soon' until this is set"
            className={inputCls}
          />
          <textarea
            aria-label={`Response ${actionIndex + 1} note`}
            rows={2}
            value={action.note ?? ""}
            onChange={(e) => patch(actionIndex, "note", e.target.value)}
            placeholder="Optional — what the person is agreeing to, e.g. permission to share live."
            className={`${inputCls} resize-y`}
          />
          <button
            type="button"
            onClick={() => setActions(section.content.actions.filter((_, i) => i !== actionIndex))}
            className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            <Trash2 size={13} aria-hidden="true" /> Remove response
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setActions([...section.content.actions, { ...EMPTY_RESPONSE_ACTION }])}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-200 px-3 text-xs font-bold text-[#87102C] hover:bg-[#FFF4F6] dark:border-white/10"
      >
        <Plus size={14} aria-hidden="true" /> Add a way to respond
      </button>
    </div>
  );
}
