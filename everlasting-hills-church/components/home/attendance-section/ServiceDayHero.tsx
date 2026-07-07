"use client";

import { motion } from "framer-motion";
import { Hand } from "lucide-react";

interface ServiceDayHeroProps {
  onClick: () => void;
  loading: boolean;
  error: string | null;
}

export default function ServiceDayHero({ onClick, loading, error }: ServiceDayHeroProps) {
  return (
    <div className="flex flex-col items-center gap-9 py-6">
      <motion.button
        type="button"
        onClick={onClick}
        disabled={loading}
        aria-label="Check in for today's service"
        className="relative outline-none focus-visible:ring-2 focus-visible:ring-[#FFB3C1] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0e0407] rounded-full disabled:cursor-not-allowed"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
      >
        {[0, 0.8, 1.6].map((delay, i) => (
          <motion.span
            key={i}
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-[#87102C]"
            initial={{ scale: 1, opacity: 0.55 }}
            animate={{ scale: 2.4, opacity: 0 }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay }}
          />
        ))}
        <motion.span
          className="relative flex items-center justify-center w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-[#a32242] via-[#87102C] to-[#5d091f] shadow-[0_24px_80px_rgba(135,16,44,0.55)] border border-white/10"
          animate={{ scale: [1, 1.05, 1], y: [0, -5, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span
            aria-hidden="true"
            className="absolute inset-1 rounded-full bg-gradient-to-br from-white/15 to-transparent pointer-events-none"
          />
          {loading ? (
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : (
            <motion.span
              animate={{ rotate: [-4, 4, -4] }}
              transition={{ duration: 0.45, repeat: Infinity, ease: "easeInOut" }}
            >
              <Hand size={52} className="text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" />
            </motion.span>
          )}
        </motion.span>
      </motion.button>

      <div className="text-center max-w-sm">
        <p className="text-white text-xl sm:text-2xl font-bold tracking-tight">
          {loading ? "Marking your presence…" : "Tap the hand to check in"}
        </p>
        <p className="text-white/55 text-sm mt-2 leading-relaxed">
          One gesture is all it takes. God&apos;s house, marked with your name.
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="text-sm text-red-200 bg-red-500/15 border border-red-400/30 rounded-xl px-4 py-2.5"
        >
          {error}
        </p>
      )}
    </div>
  );
}
