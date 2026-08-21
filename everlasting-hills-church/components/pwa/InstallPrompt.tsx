"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  isStandalone,
  registerServiceWorker,
} from "@/lib/pwa/service-worker";
import {
  isIosSafari,
  rememberDismissal,
  wasDismissedRecently,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa/install-state";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Delay before the banner appears, so it never competes with first paint. */
const APPEAR_AFTER_MS = 2500;

type Mode = "hidden" | "native" | "ios";

/**
 * Install prompt. Rendered once from the root layout.
 *
 * Three distinct states, because the platforms genuinely differ:
 *   native — Chromium fired beforeinstallprompt; tapping opens the real dialog
 *   ios    — Safari has no such API, so we show the manual share-sheet steps
 *   hidden — already installed, dismissed recently, or unsupported
 *
 * Never renders when running standalone: an install banner inside the installed
 * app is pure noise.
 */
export default function InstallPrompt() {
  const [mode, setMode] = useState<Mode>("hidden");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosSteps, setShowIosSteps] = useState(false);

  useEffect(() => {
    void registerServiceWorker();
  }, []);

  useEffect(() => {
    if (isStandalone() || wasDismissedRecently()) return;

    // Chromium fires this instead of showing its own mini-infobar once we
    // preventDefault, handing us control of when to ask.
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      window.setTimeout(() => setMode("native"), APPEAR_AFTER_MS);
    };

    // Fired when the install completes by any route, including the browser menu.
    const onInstalled = () => {
      setMode("hidden");
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // iOS never fires beforeinstallprompt, so it is scheduled directly.
    let iosTimer: number | undefined;
    if (isIosSafari()) {
      iosTimer = window.setTimeout(() => setMode("ios"), APPEAR_AFTER_MS);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      if (iosTimer) window.clearTimeout(iosTimer);
    };
  }, []);

  const dismiss = useCallback(() => {
    rememberDismissal();
    setMode("hidden");
    setShowIosSteps(false);
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    // Either way the event is single-use and cannot be replayed.
    setDeferred(null);
    setMode("hidden");
    if (outcome === "dismissed") rememberDismissal();
  }, [deferred]);

  return (
    <AnimatePresence>
      {mode !== "hidden" && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:left-auto sm:right-6 sm:w-[380px] sm:px-0"
          role="dialog"
          aria-label="Install Everlasting Hills Church"
        >
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#12080b]/95 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-xl">
            <div className="flex items-start gap-3.5 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-church-dark">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/icon-192.png" alt="" className="h-full w-full object-cover" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-semibold leading-snug text-white">
                  Add Everlasting Hills to your home screen
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-white/55">
                  {mode === "ios"
                    ? "Open it like an app, and keep reading sermons when your connection drops."
                    : "Opens like an app, works offline, and keeps you close to what is happening."}
                </p>
              </div>

              <button
                type="button"
                onClick={dismiss}
                aria-label="Dismiss"
                className="-mr-1 -mt-1 shrink-0 rounded-lg p-1.5 text-white/35 transition-colors hover:bg-white/5 hover:text-white/70"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {mode === "native" && (
              <div className="flex gap-2 px-4 pb-4">
                <button
                  type="button"
                  onClick={install}
                  className="flex-1 rounded-xl bg-burgundy px-4 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-burgundy-light focus:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-light"
                >
                  Install
                </button>
                <button
                  type="button"
                  onClick={dismiss}
                  className="rounded-xl px-4 py-2.5 text-[13.5px] font-medium text-white/50 transition-colors hover:bg-white/5 hover:text-white/80"
                >
                  Not now
                </button>
              </div>
            )}

            {mode === "ios" && (
              <div className="px-4 pb-4">
                {!showIosSteps ? (
                  <button
                    type="button"
                    onClick={() => setShowIosSteps(true)}
                    className="w-full rounded-xl bg-burgundy px-4 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-burgundy-light focus:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-light"
                  >
                    Show me how
                  </button>
                ) : (
                  <IosSteps />
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * The manual iOS route. Written as two concrete taps rather than prose, because
 * a member reading this is looking at their screen, not at us.
 */
function IosSteps() {
  return (
    <motion.ol
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={{ duration: 0.35, ease: EASE }}
      className="space-y-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-3.5"
    >
      <li className="flex items-center gap-3 text-[13px] leading-snug text-white/75">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10 text-[11px] font-semibold text-white/70">
          1
        </span>
        <span className="flex flex-wrap items-center gap-1.5">
          Tap
          <ShareIcon />
          in the Safari toolbar
        </span>
      </li>
      <li className="flex items-center gap-3 text-[13px] leading-snug text-white/75">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10 text-[11px] font-semibold text-white/70">
          2
        </span>
        <span>
          Choose <span className="font-semibold text-white">Add to Home Screen</span>
        </span>
      </li>
    </motion.ol>
  );
}

/** The iOS share glyph, drawn inline so the step reads as one sentence. */
function ShareIcon() {
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-white/15 bg-white/[0.06]">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#0A84FF]" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-label="Share">
        <path d="M12 15V3" />
        <path d="m8 7 4-4 4 4" />
        <path d="M4 13v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
      </svg>
    </span>
  );
}
