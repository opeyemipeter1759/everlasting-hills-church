"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, Check, Loader2, Share, X } from "lucide-react";
import { getPermissionState, requestAndSubscribe, subscribeCurrentDevice, type PermissionState } from "@/lib/pwa/push";

const DISMISSED_KEY = "ehc-push-optin-dismissed";

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Asks a member, in words, to turn on notifications — the browser prompt only
 * ever follows their tap (see lib/pwa/push). A phone that already granted
 * permission is quietly registered again, so a member who said yes before the
 * server could send still starts receiving.
 */
export function PushOptInCard() {
  const [state, setState] = useState<PermissionState | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [busy, setBusy] = useState(false);
  const [justEnabled, setJustEnabled] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const current = getPermissionState();
    setState(current);
    setDismissed(readDismissed());
    if (current === "granted") subscribeCurrentDevice().catch(() => undefined);
  }, []);

  if (state === null || dismissed) return null;
  if (!justEnabled && state !== "default" && state !== "ios-needs-install") return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      /* private mode: it simply shows again next time */
    }
  };

  const enable = async () => {
    setBusy(true);
    setFailed(false);
    try {
      const result = await requestAndSubscribe();
      setState(result);
      if (result === "granted") setJustEnabled(true);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  if (justEnabled) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
        <Check size={18} className="shrink-0" />
        <p className="flex-1">Notifications are on. We&rsquo;ll let you know before each session and when we go live.</p>
        <button type="button" onClick={dismiss} aria-label="Close" className="rounded-full p-1 hover:bg-emerald-100 dark:hover:bg-emerald-500/20">
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#87102C]/15 bg-gradient-to-br from-[#87102C] to-[#5c0a1e] p-5 text-white shadow-sm">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Not now"
        className="absolute right-3 top-3 rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
      >
        <X size={16} />
      </button>
      <div className="flex items-start gap-4 pr-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
          <BellRing size={20} />
        </span>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold">Never miss a session</p>
          <p className="mt-1 text-sm leading-relaxed text-white/80">
            Get a notification 2 hours before each prayer session and service, and the moment we go live on YouTube.
          </p>
          {state === "ios-needs-install" ? (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs text-white/90">
              On iPhone, tap <Share size={13} className="inline" /> then <strong>Add to Home Screen</strong>, and open the app from there to turn them on.
            </p>
          ) : (
            <button
              type="button"
              onClick={enable}
              disabled={busy}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#87102C] hover:bg-white/90 disabled:opacity-70"
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Bell size={15} />}
              Turn on notifications
            </button>
          )}
          {failed && <p role="alert" className="mt-2 text-xs text-white/80">That didn&rsquo;t work. Please try again in a moment.</p>}
        </div>
      </div>
    </div>
  );
}
