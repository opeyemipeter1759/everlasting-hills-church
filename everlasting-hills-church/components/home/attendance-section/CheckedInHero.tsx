"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export default function CheckedInHero({ justCheckedIn }: { justCheckedIn: boolean }) {
  return (
    <div className="flex flex-col items-center gap-7 py-8 text-center">
      <motion.div
        initial={justCheckedIn ? { scale: 0, rotate: -90 } : false}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", duration: 0.7, bounce: 0.45 }}
        className="relative w-28 h-28 rounded-full bg-gradient-to-br from-emerald-400/25 to-emerald-600/25 border border-emerald-300/40 flex items-center justify-center"
      >
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-emerald-400/30"
          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut" }}
        />
        <CheckCircle2 size={52} className="text-emerald-300 relative" strokeWidth={2.2} />
      </motion.div>
      <div>
        <p className="text-white text-xl sm:text-2xl font-bold tracking-tight">
          You&apos;re counted for today.
        </p>
        <p className="text-white/55 text-sm mt-2">See you in service.</p>
      </div>
    </div>
  );
}
