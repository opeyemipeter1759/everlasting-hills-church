"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { GiftPartyHeader } from "./GiftPartyHeader";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  dayLabel: string | null;
  children: React.ReactNode;
}

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

/**
 * The register / change modal for the gift exchange & picnic: the card's party banner on top,
 * a springy entrance and exit, focus kept inside, Escape and the backdrop close it.
 */
export function GiftRegisterModal({ open, onClose, title, dayLabel, children }: Props) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const still = useReducedMotion() ?? false;

  useEffect(() => {
    if (!open) return;
    const before = document.activeElement as HTMLElement | null;
    const focusables = () => Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    const frame = requestAnimationFrame(() => (focusables()[0] ?? dialogRef.current)?.focus());

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const list = focusables();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && (document.activeElement === first || !dialogRef.current?.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      if (before?.isConnected) before.focus();
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <div className="pointer-events-none relative flex min-h-full items-center justify-center p-4">
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              tabIndex={-1}
              className="pointer-events-auto relative w-full max-w-md overflow-hidden rounded-2xl border border-[#E7CDD3]/60 bg-white shadow-2xl outline-none dark:border-white/10 dark:bg-[#1c1c1e]"
              initial={still ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={still ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", stiffness: 340, damping: 26 }}
            >
              <GiftPartyHeader titleId={titleId} kicker="Picnic & gift exchange" title={title} dayLabel={dayLabel} level="h2" className="pr-12" />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-3 top-7 flex h-8 w-8 items-center justify-center rounded-lg text-white/75 transition-colors hover:bg-white/15 hover:text-white"
              >
                <X size={16} />
              </button>
              <div className="px-5 py-5 sm:px-6">{children}</div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
