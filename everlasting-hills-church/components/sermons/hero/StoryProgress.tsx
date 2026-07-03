"use client";

import { motion } from "framer-motion";
import { AUTO_ROTATE_MS } from "./types";

/** Instagram/TikTok-story-style segmented progress bar, standing in for plain carousel dots. */
export default function StoryProgress({
  count,
  active,
  paused,
  onJump,
}: {
  count: number;
  active: number;
  paused: boolean;
  onJump: (index: number) => void;
}) {
  if (count < 2) return null;
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onJump(i)}
          aria-label={`Go to sermon ${i + 1}`}
          aria-current={i === active}
          className="group relative h-[3px] w-7 overflow-hidden rounded-full bg-white/15 sm:w-9"
        >
          {i < active && <div className="absolute inset-0 rounded-full bg-white" />}
          {i === active && (
            <motion.div
              key={`${active}-${paused}`}
              className="absolute inset-y-0 left-0 rounded-full bg-white"
              initial={{ width: "0%" }}
              animate={{ width: paused ? undefined : "100%" }}
              transition={paused ? { duration: 0 } : { duration: AUTO_ROTATE_MS / 1000, ease: "linear" }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
