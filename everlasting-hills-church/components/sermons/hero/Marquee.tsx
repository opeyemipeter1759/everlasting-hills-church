"use client";

import { motion } from "framer-motion";

/** Seamless auto-scrolling ticker — content is duplicated once and translated exactly half
 * its width so the loop point is invisible. */
export default function Marquee({ items }: { items: string[] }) {
  const content = items.filter(Boolean);
  if (content.length === 0) return null;

  const row = (keyPrefix: string) => (
    <div className="flex shrink-0 items-center gap-6 pr-6">
      {content.map((item, i) => (
        <span key={`${keyPrefix}-${i}`} className="flex items-center gap-6 whitespace-nowrap">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">{item}</span>
          <span className="h-1 w-1 rounded-full bg-[#87102C]" />
        </span>
      ))}
    </div>
  );

  return (
    <div className="relative flex overflow-hidden border-t border-white/8 bg-black py-2.5">
      <motion.div
        className="flex shrink-0"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      >
        {row("a")}
        {row("b")}
      </motion.div>
    </div>
  );
}
