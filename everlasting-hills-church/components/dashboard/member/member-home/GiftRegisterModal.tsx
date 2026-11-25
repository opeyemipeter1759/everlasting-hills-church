"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { GiftModalAside } from "./GiftModalAside";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  /** One line under the title. */
  subtitle: string;
  children: React.ReactNode;
}

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

/**
 * The register / change modal for the picnic & gift exchange: an invitation panel
 * (photo, date, what happens) beside the form. Springy entrance and exit, focus
 * kept inside, Escape and the backdrop close it.
 */
export function GiftRegisterModal({ open, onClose, title, subtitle, children }: Props) {
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
            className="fixed inset-0 bg-[#140C06]/70 backdrop-blur-sm"
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
              className="pointer-events-auto relative grid w-full max-w-4xl overflow-hidden rounded-3xl bg-[#FFFDF8] shadow-[0_40px_100px_-30px_rgba(20,12,6,0.7)] outline-none ring-1 ring-black/5 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] dark:bg-[#1c1a18] dark:ring-white/10"
              initial={still ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={still ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", stiffness: 340, damping: 26 }}
            >
              <GiftModalAside />
              <div className="relative px-5 pb-6 pt-6 sm:px-8 sm:pb-8 sm:pt-8">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-[#1B1714]/55 transition-colors hover:bg-[#1B1714]/[0.06] hover:text-[#1B1714] dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <X size={18} />
                </button>
                <p className="pr-10 text-sm font-medium text-[#87102C] dark:text-[#FFB3C1]">Picnic &amp; gift exchange</p>
                <h2 id={titleId} className="mt-1 pr-10 font-serif text-[1.9rem] leading-[1.1] text-[#1B1714] dark:text-white">
                  {title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#1B1714]/65 dark:text-white/60">{subtitle}</p>
                <div className="mt-6">{children}</div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
