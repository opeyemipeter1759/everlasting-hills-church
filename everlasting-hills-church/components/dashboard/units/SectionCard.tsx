"use client";

import { motion } from "framer-motion";
import type { Users2 } from "lucide-react";

export function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] as const },
  };
}

export default function SectionCard({
  icon: Icon,
  title,
  count,
  children,
  delay,
}: {
  icon: typeof Users2;
  title: string;
  count?: number;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      {...fadeUp(delay)}
      className="bg-white dark:bg-[#1c1c1e] border border-gray-200/80 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm"
    >
      <div className="px-5 py-4 border-b border-gray-100 dark:border-white/8 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#87102C]/10 dark:bg-[#87102C]/20 flex-shrink-0">
          <Icon size={14} className="text-[#87102C] dark:text-[#e8768a]" />
        </span>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
          {title}
          {count !== undefined ? ` (${count})` : ""}
        </p>
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  );
}
