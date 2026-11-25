"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Gift, Loader2, UtensilsCrossed, type LucideIcon } from "lucide-react";
import type { GiftChoice } from "@/lib/api/gift-exchange";
import { PHOTOS } from "@/components/picnic/picnic-config";
import { GiftOptionTile } from "./GiftOptionTile";

export const GIFT_OPTIONS: { key: keyof GiftChoice; label: string; hint: string; Icon: LucideIcon }[] = [
  { key: "picnic", label: "Picnic", hint: "Food, games and fellowship on the grass, with the gift exchange.", Icon: UtensilsCrossed },
  { key: "giftExchange", label: "Gift exchange", hint: "Just the gift swap: bring a wrapped gift for another member.", Icon: Gift },
];

const STEPS = [
  "Sign up here before the day.",
  "Your gift partner is revealed ahead of the day.",
  "Bring a wrapped gift and swap at the picnic.",
];

interface Props {
  initial: GiftChoice;
  /** Already signed up: this is a change, not a first sign-up. */
  changing: boolean;
  saving: boolean;
  onSave: (choice: GiftChoice) => void;
  onCancel: () => void;
}

/**
 * Choose the picnic (which always includes the gift exchange) or the gift exchange on its own.
 * Ticking the picnic locks the gift exchange on. Shown inside the register modal.
 */
export function GiftChoiceForm({ initial, changing, saving, onSave, onCancel }: Props) {
  const [choice, setChoice] = useState<GiftChoice>(initial);
  const nothingPicked = !choice.giftExchange && !choice.picnic;
  const still = useReducedMotion() ?? false;
  const summary = choice.picnic ? "The picnic and the gift exchange" : choice.giftExchange ? "The gift exchange only" : "Nothing yet";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!nothingPicked) onSave(choice);
      }}
    >
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-[#1B1714] dark:text-white">What would you like to join?</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {GIFT_OPTIONS.map(({ key, label, hint, Icon }, i) => {
            const locked = key === "giftExchange" && choice.picnic;
            return (
              <GiftOptionTile
                key={key}
                label={label}
                hint={hint}
                Icon={Icon}
                photo={key === "picnic" ? PHOTOS.gingham.src.replace(/w=\d+/, "w=600") : undefined}
                badge={key === "picnic" ? "Includes the gift exchange" : undefined}
                checked={choice[key] || locked}
                locked={locked}
                delay={0.12 + i * 0.08}
                onToggle={(on) =>
                  setChoice((c) => (key === "picnic" && on ? { picnic: true, giftExchange: true } : { ...c, [key]: on }))
                }
              />
            );
          })}
        </div>
      </fieldset>

      <div className="mt-5 rounded-2xl bg-[#F6EFE2] p-4 dark:bg-white/[0.04]">
        <p className="text-sm font-semibold text-[#1B1714] dark:text-white">How the gift exchange works</p>
        <ol className="mt-3 grid gap-3 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step} className="flex gap-2.5 text-[13px] leading-snug text-[#1B1714]/70 dark:text-white/60">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1E3A2A] font-serif text-xs text-[#FBF4E6]">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6 flex flex-col gap-4 border-t border-[#1B1714]/10 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
        <div aria-live="polite" className="text-sm">
          <span className="text-[#1B1714]/55 dark:text-white/50">You&apos;re signing up for</span>
          <span className="block font-semibold text-[#1B1714] dark:text-white">{summary}</span>
          <AnimatePresence initial={false}>
            {nothingPicked && (
              <motion.span
                className="block text-xs text-[#87102C] dark:text-[#FFB3C1]"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                Tick at least one to sign up.
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <button
            type="button"
            disabled={saving}
            onClick={onCancel}
            className="inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold text-[#1B1714]/70 transition-colors hover:bg-[#1B1714]/[0.05] hover:text-[#1B1714] dark:text-white/70 dark:hover:bg-white/10"
          >
            Cancel
          </button>
          <motion.button
            type="submit"
            disabled={saving || nothingPicked}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#1E3A2A] px-6 text-sm font-semibold text-[#FBF4E6] shadow-[0_12px_28px_-14px_rgba(30,58,42,0.9)] transition-colors hover:bg-[#16301F] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
            whileHover={still || nothingPicked ? undefined : { scale: 1.03 }}
            whileTap={still || nothingPicked ? undefined : { scale: 0.96 }}
          >
            {saving && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
            {changing ? "Save changes" : "Count me in"}
            {!saving && <ArrowRight size={15} aria-hidden="true" />}
          </motion.button>
        </div>
      </div>
    </form>
  );
}
