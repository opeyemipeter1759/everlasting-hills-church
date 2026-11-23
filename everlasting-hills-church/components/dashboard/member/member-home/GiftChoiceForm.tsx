"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { GiftChoice } from "@/lib/api/gift-exchange";

export const GIFT_OPTIONS: { key: keyof GiftChoice; label: string; hint: string }[] = [
  { key: "giftExchange", label: "Gift exchange", hint: "Bring a wrapped gift and swap with another member." },
  { key: "picnic", label: "Picnic", hint: "Food and fellowship with the church family." },
];

export const primaryBtn =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#87102C] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#6E0C24] disabled:cursor-not-allowed disabled:opacity-50";
export const quietBtn =
  "inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 dark:text-white/70 dark:hover:bg-white/10";

interface Props {
  initial: GiftChoice;
  /** Already signed up: this is a change, not a first sign-up. */
  changing: boolean;
  saving: boolean;
  onSave: (choice: GiftChoice) => void;
  onCancel?: () => void;
}

/** Tick the gift exchange, the picnic, or both. At least one is required. */
export function GiftChoiceForm({ initial, changing, saving, onSave, onCancel }: Props) {
  const [choice, setChoice] = useState<GiftChoice>(initial);
  const nothingPicked = !choice.giftExchange && !choice.picnic;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!nothingPicked) onSave(choice);
      }}
    >
      <fieldset>
        <legend className="mb-3 text-sm text-gray-600 dark:text-white/65">
          {changing ? "Change what you're coming for:" : "Which would you like to join? Pick one or both."}
        </legend>
        <div className="space-y-2.5">
          {GIFT_OPTIONS.map((o) => {
            const checked = choice[o.key];
            return (
              <label
                key={o.key}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                  checked
                    ? "border-[#87102C] bg-[#87102C]/[0.04] dark:border-[#FFB3C1]/60 dark:bg-[#87102C]/15"
                    : "border-gray-200 hover:border-gray-300 dark:border-white/10 dark:hover:border-white/20"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChoice((c) => ({ ...c, [o.key]: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 accent-[#87102C]"
                />
                <span>
                  <span className="block text-sm font-semibold text-[#111] dark:text-white">{o.label}</span>
                  <span className="block text-xs text-gray-500 dark:text-white/50">{o.hint}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {nothingPicked && <p className="mt-2 text-xs text-gray-500 dark:text-white/50">Tick at least one to sign up.</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="submit" disabled={saving || nothingPicked} className={`${primaryBtn} flex-1 sm:flex-none`}>
          {saving && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
          {changing ? "Save changes" : "Count me in"}
        </button>
        {onCancel && (
          <button type="button" disabled={saving} onClick={onCancel} className={quietBtn}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
