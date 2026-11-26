"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, UtensilsCrossed } from "lucide-react";
import PicnicCmsImage from "@/components/picnic/PicnicCmsImage";

/** Fine red gingham, drawn in CSS so the dashboard needs no extra stylesheet. */
const GINGHAM = {
  backgroundColor: "#FBF6EE",
  backgroundImage:
    "linear-gradient(90deg, rgba(135,16,44,0.5) 50%, transparent 50%), linear-gradient(rgba(135,16,44,0.5) 50%, transparent 50%)",
  backgroundSize: "12px 12px",
} as const;

interface HeaderProps {
  titleId: string;
  kicker: string;
  title: string;
  dayLabel: string | null;
  /** h3 inside the card, h2 as a dialog's title. */
  level?: "h2" | "h3";
  /** Room on the right for a close button. */
  className?: string;
}

/** The picnic banner at the top of the gift exchange & picnic card and its register modal. */
export function GiftPartyHeader({ titleId, kicker, title, dayLabel, level = "h3", className = "" }: HeaderProps) {
  const still = useReducedMotion() ?? false;
  const Heading = level;

  return (
    <div className={`relative isolate overflow-hidden text-white ${className}`}>
      <PicnicCmsImage spot="verse" width={900} fill sizes="420px" className="-z-10 object-cover object-[center_62%]" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#1A0E07]/85 via-[#1A0E07]/45 to-[#1A0E07]/10" />

      <div className="px-5 pb-6 pt-14">
        <motion.div
          className="flex items-center gap-3"
          initial={still ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F7F0E3] text-[#87102C] shadow-sm">
            <UtensilsCrossed size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#F7F0E3]/80">{kicker}</p>
            <Heading id={titleId} className="text-[17px] font-bold leading-snug">
              {title}
            </Heading>
          </div>
        </motion.div>

        {dayLabel && (
          <motion.p
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#F7F0E3]/15 px-3 py-1 text-xs font-medium ring-1 ring-[#F7F0E3]/25 backdrop-blur-sm"
            initial={still ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <CalendarDays size={13} aria-hidden="true" />
            {dayLabel}
          </motion.p>
        )}
      </div>

      <div aria-hidden="true" className="h-2 w-full" style={GINGHAM} />
    </div>
  );
}
