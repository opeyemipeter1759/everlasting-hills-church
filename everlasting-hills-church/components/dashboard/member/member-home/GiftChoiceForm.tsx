"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Gift, Loader2, UtensilsCrossed, type LucideIcon } from "lucide-react";
import type { GiftChoice } from "@/lib/api/gift-exchange";
import { btnPrimary, btnSecondary, iconBg, iconCl, itemTitle, metaText } from "./tokens";

export const GIFT_OPTIONS: { key: keyof GiftChoice; label: string; hint: string; Icon: LucideIcon }[] = [
  { key: "giftExchange", label: "Gift exchange", hint: "Bring a wrapped gift and swap with another member.", Icon: Gift },
  { key: "picnic", label: "Picnic", hint: "Food and fellowship with the church family.", Icon: UtensilsCrossed },
];

interface Props {
  initial: GiftChoice;
  /** Already signed up: this is a change, not a first sign-up. */
  changing: boolean;
  saving: boolean;
  onSave: (choice: GiftChoice) => void;
  onCancel: () => void;
}

/** Tick the gift exchange, the picnic, or both. At least one is required. Shown inside the register modal. */
export function GiftChoiceForm({ initial, changing, saving, onSave, onCancel }: Props) {
  const [choice, setChoice] = useState<GiftChoice>(initial);
  const nothingPicked = !choice.giftExchange && !choice.picnic;
  const still = useReducedMotion() ?? false;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!nothingPicked) onSave(choice);
      }}
    >
      <fieldset>
        <legend className={`mb-3 ${metaText}`}>Pick one or both.</legend>
        <div className="space-y-2.5">
          {GIFT_OPTIONS.map(({ key, label, hint, Icon }, i) => {
            const checked = choice[key];
            return (
              <motion.label
                key={key}
                initial={still ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut", delay: 0.15 + i * 0.08 }}
                whileTap={still ? undefined : { scale: 0.98 }}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#87102C]/30 ${
                  checked
                    ? "border-[#87102C] bg-[#FFF5F7] dark:border-[#FFB3C1]/50 dark:bg-[#87102C]/15"
                    : "border-[#E7CDD3] hover:border-[#87102C]/40 dark:border-white/10 dark:hover:border-white/25"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChoice((c) => ({ ...c, [key]: e.target.checked }))}
                  className="sr-only"
                />
                <motion.span
                  className={iconBg}
                  animate={checked && !still ? { rotate: [0, -12, 10, 0], scale: [1, 1.12, 1] } : { rotate: 0, scale: 1 }}
                  transition={{ duration: 0.45 }}
                >
                  <Icon size={15} className={iconCl} aria-hidden="true" />
                </motion.span>
                <span className="min-w-0 flex-1">
                  <span className={`block ${itemTitle}`}>{label}</span>
                  <span className={`block ${metaText}`}>{hint}</span>
                </span>
                <span
                  aria-hidden="true"
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                    checked ? "border-[#87102C] bg-[#87102C] text-white" : "border-[#D9BFC5] text-transparent dark:border-white/25"
                  }`}
                >
                  <AnimatePresence initial={false}>
                    {checked && (
                      <motion.span
                        key="tick"
                        initial={still ? false : { scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 18 }}
                      >
                        <Check size={13} strokeWidth={3} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
              </motion.label>
            );
          })}
        </div>
      </fieldset>

      <AnimatePresence initial={false}>
        {nothingPicked && (
          <motion.p
            className={`mt-2 ${metaText}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            Tick at least one to sign up.
          </motion.p>
        )}
      </AnimatePresence>

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" disabled={saving} onClick={onCancel} className={btnSecondary}>
          Cancel
        </button>
        <motion.button
          type="submit"
          disabled={saving || nothingPicked}
          className={`${btnPrimary} shadow-md shadow-[#87102C]/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none`}
          whileHover={still || nothingPicked ? undefined : { scale: 1.03 }}
          whileTap={still || nothingPicked ? undefined : { scale: 0.96 }}
        >
          {saving ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Gift size={15} aria-hidden="true" />}
          {changing ? "Save changes" : "Count me in"}
        </motion.button>
      </div>
    </form>
  );
}
