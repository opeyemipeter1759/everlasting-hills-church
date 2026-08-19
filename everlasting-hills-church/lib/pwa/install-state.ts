"use client";

/**
 * Platform detection and dismissal memory for the install prompt.
 *
 * The install gesture is not the same everywhere, and getting this wrong is the
 * difference between an install and a confused member:
 *
 *   Android / desktop Chromium — the browser fires `beforeinstallprompt`, which
 *     we capture and replay on tap to show the real native install dialog.
 *   iOS Safari — there is no such event and no programmatic install. The only
 *     route is Share, then Add to Home Screen, done by hand. So iOS gets
 *     instructions, never a button that pretends to install.
 *   Already installed — nothing at all.
 *
 * This matters beyond convenience: on iOS, Web Push only works for a PWA that
 * has been added to the home screen. A member browsing in Safari cannot receive
 * a notification no matter what they toggle. Installation is a prerequisite
 * there, not a nicety, which is why Phase 3 links back to this flow.
 */

const DISMISS_KEY = "ehc-install-prompt-dismissed-at";

/** How long a dismissal is honoured before the banner may reappear. */
const DISMISS_DAYS = 30;

export type InstallPlatform = "installed" | "ios-safari" | "prompt-capable" | "unsupported";

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function isIos(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ reports itself as a Mac; the touch point count disambiguates.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/**
 * True only for real Safari on iOS. Chrome and Firefox on iOS are WebKit
 * wrappers that cannot add to the home screen at all, so showing them the
 * share-sheet steps would send the member down a dead end.
 */
export function isIosSafari(): boolean {
  if (!isIos()) return false;
  const ua = window.navigator.userAgent;
  return /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
}

export function wasDismissedRecently(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at)) return false;
    return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    // Private mode or blocked storage. Treat as not dismissed, but the banner
    // is still dismissible in-session, so it cannot become a permanent nag.
    return false;
  }
}

export function rememberDismissal(): void {
  try {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* storage unavailable; dismissal lasts for this session only */
  }
}
