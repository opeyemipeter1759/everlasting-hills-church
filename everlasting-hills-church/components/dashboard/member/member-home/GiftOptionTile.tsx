"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Lock, type LucideIcon } from "lucide-react";

interface Props {
  label: string;
  hint: string;
  Icon: LucideIcon;
  /** Photo across the top; without one, a soft wine panel with the icon. */
  photo?: string;
  badge?: string;
  checked: boolean;
  /** Ticked for the member and not theirs to untick (included with the picnic). */
  locked: boolean;
  delay: number;
  onToggle: (checked: boolean) => void;
}

/** One big choice in the register modal: picture, name, what it means, and a tick. */
export function GiftOptionTile({ label, hint, Icon, photo, badge, checked, locked, delay, onToggle }: Props) {
  const still = useReducedMotion() ?? false;

  return (
    <motion.label
      initial={still ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay }}
      whileHover={still || locked ? undefined : { y: -3 }}
      whileTap={still || locked ? undefined : { scale: 0.98 }}
      className={`group relative flex ${locked ? "cursor-default" : "cursor-pointer"} flex-col overflow-hidden rounded-2xl border-2 bg-white transition-[border-color,box-shadow] has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[#87102C]/20 dark:bg-white/[0.04] ${
        checked
          ? "border-[#87102C] shadow-[0_18px_40px_-22px_rgba(135,16,44,0.6)] dark:border-[#FFB3C1]/60"
          : "border-[#EADFCB] hover:border-[#87102C]/35 dark:border-white/10 dark:hover:border-white/25"
      }`}
    >
      <input type="checkbox" checked={checked} disabled={locked} onChange={(e) => onToggle(e.target.checked)} className="sr-only" />

      <div className="relative h-28 overflow-hidden">
        {photo ? (
          <Image src={photo} alt="" fill sizes="280px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,#B3264A,#87102C_55%,#5E0A1F)]">
            <Icon size={40} strokeWidth={1.5} className="text-[#FBE3E8]" aria-hidden="true" />
          </div>
        )}
        {badge && (
          <span className="absolute left-3 top-3 rounded-full bg-[#FBF6EE] px-2.5 py-1 text-[11px] font-semibold text-[#1E3A2A] shadow-sm">
            {badge}
          </span>
        )}
        <span
          aria-hidden="true"
          className={`absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors ${
            checked ? "border-[#87102C] bg-[#87102C] text-white" : "border-white/90 bg-black/20 text-transparent backdrop-blur-sm"
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
                {locked ? <Lock size={12} strokeWidth={2.5} /> : <Check size={14} strokeWidth={3} />}
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </div>

      <span className="flex flex-1 flex-col p-4">
        <span className="flex items-center gap-2 text-base font-semibold text-[#1B1714] dark:text-white">
          <Icon size={16} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
          {label}
        </span>
        <span className="mt-1 text-[13px] leading-relaxed text-[#1B1714]/60 dark:text-white/55">
          {locked ? "Included with the picnic." : hint}
        </span>
      </span>
    </motion.label>
  );
}
