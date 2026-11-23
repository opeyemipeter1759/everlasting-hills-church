"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import type { GIFT_OPTIONS } from "./GiftChoiceForm";

/** "You're registered for" with a popping tick and a tag for each thing the member joined. */
export function GiftJoinedSummary({ joined }: { joined: typeof GIFT_OPTIONS }) {
  const still = useReducedMotion() ?? false;
  return (
    <div>
      <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
        <motion.span
          className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15"
          initial={still ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 12, delay: 0.1 }}
        >
          <Check size={13} strokeWidth={3} aria-hidden="true" />
        </motion.span>
        You&apos;re registered for
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {joined.map(({ key, label, Icon }, i) => (
          <motion.li key={key}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#FFE8ED] px-2.5 py-1 text-xs font-semibold text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#FFB3C1]"
            initial={still ? false : { opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 16, delay: 0.2 + i * 0.08 }}>
            <Icon size={13} aria-hidden="true" />
            {label}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
