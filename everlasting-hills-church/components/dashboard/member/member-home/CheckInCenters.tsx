"use client";

import { motion } from "framer-motion";
import { Hand, CheckCircle2 } from "lucide-react";

export function ServiceDayCenter({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <div className="flex flex-col items-center gap-7">
      <motion.button
        type="button" onClick={onClick} disabled={loading}
        aria-label="Check in for today's service"
        className="relative outline-none focus-visible:ring-2 focus-visible:ring-[#FFB3C1] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0e0407] rounded-full disabled:cursor-not-allowed"
        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
      >
        {[0, 0.8, 1.6].map((delay, i) => (
          <motion.span
            key={i} aria-hidden="true"
            className="absolute inset-0 rounded-full bg-[#87102C]"
            initial={{ scale: 1, opacity: 0.55 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay }}
          />
        ))}
        <motion.span
          className="relative flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-[#a32242] via-[#87102C] to-[#5d091f] shadow-[0_20px_60px_rgba(135,16,44,0.55)] border border-white/10"
          animate={{ scale: [1, 1.05, 1], y: [0, -4, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span aria-hidden="true" className="absolute inset-1 rounded-full bg-gradient-to-br from-white/15 to-transparent pointer-events-none" />
          {loading ? (
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
              className="w-9 h-9 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : (
            <motion.span
              animate={{ rotate: [-4, 4, -4] }}
              transition={{ duration: 0.45, repeat: Infinity, ease: "easeInOut" }}
            >
              <Hand size={40} className="text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]" />
            </motion.span>
          )}
        </motion.span>
      </motion.button>

      <div className="text-center max-w-xs">
        <p className="text-white text-lg font-bold tracking-tight">
          {loading ? "Marking your presence…" : "Tap the hand to check in"}
        </p>
        <p className="text-white/55 text-xs mt-1.5 leading-relaxed">
          One gesture is all it takes. God&apos;s house, marked with your name.
        </p>
      </div>
    </div>
  );
}

export function CheckedInCenter() {
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", duration: 0.7, bounce: 0.45 }}
        className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400/25 to-emerald-600/25 border border-emerald-300/40 flex items-center justify-center"
      >
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-emerald-400/25"
          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut" }}
        />
        <CheckCircle2 size={42} className="text-emerald-300 relative" strokeWidth={2.2} />
      </motion.div>
      <div>
        <p className="text-white text-xl font-bold tracking-tight">You&apos;re in.</p>
        <p className="text-white/55 text-xs mt-1.5">God bless you — see you in service.</p>
      </div>
    </div>
  );
}
