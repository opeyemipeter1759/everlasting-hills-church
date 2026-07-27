"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Smooth mount-in fade — for content that arrives after its container has
 * already painted (a Suspense boundary resolving, a client fetch landing),
 * so the swap reads as an arrival rather than a pop/layout jump.
 *
 * Not a scroll trigger (see ScrollReveal for that): this fires as soon as the
 * wrapped tree mounts, which is exactly the moment a Suspense fallback is
 * replaced by its resolved children.
 */
export function FadeIn({
  children,
  delay = 0,
  y = 12,
  duration = 0.5,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  duration?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
