"use client";

import { useEffect, useState } from "react";
import { Calendar, Check, Copy, RefreshCw } from "lucide-react";
import { apiClient } from "@/lib/api/axios";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";

type Platform = "google" | "apple" | "outlook";

const PLATFORM_STEPS: Record<Platform, { label: string; steps: string[] }> = {
  google: {
    label: "Google Calendar",
    steps: [
      "Open Google Calendar on a computer",
      "Beside Other calendars, click the plus, then From URL",
      "Paste the link above and click Add calendar",
    ],
  },
  apple: {
    label: "Apple Calendar",
    steps: [
      "On iPhone, open Settings, then Calendar, then Accounts",
      "Tap Add Account, then Other, then Add Subscribed Calendar",
      "Paste the link above and tap Next",
    ],
  },
  outlook: {
    label: "Outlook",
    steps: [
      "Open Outlook on the web and go to Calendar",
      "Select Add calendar, then Subscribe from web",
      "Paste the link above and select Import",
    ],
  },
};

/**
 * Calendar subscription panel.
 *
 * The feed URL is a bearer credential, so the copy here has to be honest about
 * that without being alarming: anyone holding the link can read this member's
 * schedule, which is exactly why regenerating is offered beside it.
 */
export default function CalendarSubscriptionCard() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [platform, setPlatform] = useState<Platform>("google");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get("/calendar/me/feed-token");
        const body = res.data?.data ?? res.data;
        if (!cancelled) setToken(body?.token ?? null);
      } catch {
        if (!cancelled) setError("We could not load your calendar link. Please try again later.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Built from the API origin, not the site origin: the feed is served by the
  // API, and a calendar client fetches it directly with no app in between.
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
  const feedUrl = token ? `${apiBase}/calendar/${token}.ics` : "";

  async function copy() {
    if (!feedUrl) return;
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copying failed. Select the link and copy it manually.");
    }
  }

  async function regenerate() {
    setRegenerating(true);
    setError(null);
    try {
      const res = await apiClient.post("/calendar/me/feed-token/regenerate");
      const body = res.data?.data ?? res.data;
      setToken(body?.token ?? null);
    } catch {
      setError("We could not create a new link. Please try again.");
    } finally {
      setRegenerating(false);
      setConfirmOpen(false);
    }
  }

  return (
    <div className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl shadow-[0_1px_2px_rgba(135,16,44,0.04)] dark:shadow-none">
      <div className="px-6 sm:px-8 pt-7 pb-5 border-b border-[#E7CDD3]/40 dark:border-white/[0.07]">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF4F6] dark:bg-white/[0.06] text-[#87102C] dark:text-[#FFB3C1]">
            <Calendar className="h-[18px] w-[18px]" />
          </span>
          <div>
            <h2 className="text-[15px] font-bold text-[#111] dark:text-white">
              Subscribe to the church calendar
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-[#8a7e80] dark:text-white/50">
              Add one link and services, events and your own serving dates appear in the calendar
              you already use. It stays up to date on its own.
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 sm:px-8 py-6 space-y-5">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="feed-url"
            className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a7e80] dark:text-white/40"
          >
            Your personal calendar link
          </label>
          <div className="flex gap-2">
            <input
              id="feed-url"
              readOnly
              value={loading ? "Loading..." : feedUrl}
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 rounded-xl border border-[#E7CDD3] bg-[#FFF9FA] px-3.5 py-2.5 font-mono text-[12px] text-[#5A4A4D] outline-none focus:border-[#87102C]/40 dark:border-white/[0.12] dark:bg-white/[0.03] dark:text-white/70"
            />
            <button
              type="button"
              onClick={copy}
              disabled={!feedUrl}
              className="shrink-0 rounded-xl bg-[#87102C] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6E0C24] disabled:opacity-50"
            >
              {copied ? (
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4" /> Copied
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Copy className="h-4 w-4" /> Copy
                </span>
              )}
            </button>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-[#8a7e80] dark:text-white/45">
            Treat this like a password. Anyone who has the link can see your church schedule, so
            share it only with people you would show your calendar to.
          </p>
        </div>

        <div>
          <div className="mb-3 flex gap-1.5">
            {(Object.keys(PLATFORM_STEPS) as Platform[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setPlatform(key)}
                className={`rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                  platform === key
                    ? "bg-[#87102C] text-white"
                    : "bg-[#FFF4F6] text-[#5A4A4D] hover:bg-[#FFE8ED] dark:bg-white/[0.05] dark:text-white/60 dark:hover:bg-white/[0.09]"
                }`}
              >
                {PLATFORM_STEPS[key].label}
              </button>
            ))}
          </div>
          <ol className="space-y-2 rounded-xl border border-[#E7CDD3]/50 bg-[#FFF9FA] p-4 dark:border-white/[0.08] dark:bg-white/[0.02]">
            {PLATFORM_STEPS[platform].steps.map((step, i) => (
              <li
                key={step}
                className="flex gap-2.5 text-[13px] leading-snug text-[#5A4A4D] dark:text-white/65"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#87102C]/10 text-[11px] font-bold text-[#87102C] dark:bg-white/10 dark:text-[#FFB3C1]">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
          <p className="mt-2 text-[12px] leading-relaxed text-[#8a7e80] dark:text-white/45">
            Calendar apps check for updates on their own schedule, usually every few hours, so a
            change may take a little while to show up. Anything urgent is sent as a notification
            instead.
          </p>
        </div>

        <div className="border-t border-[#E7CDD3]/40 pt-5 dark:border-white/[0.07]">
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={!token || regenerating}
            className="flex items-center gap-2 rounded-xl border border-[#E7CDD3] px-4 py-2.5 text-sm font-semibold text-[#5A4A4D] transition-colors hover:bg-[#FFF4F6] disabled:opacity-50 dark:border-white/[0.14] dark:text-white/70 dark:hover:bg-white/[0.07]"
          >
            <RefreshCw className={`h-4 w-4 ${regenerating ? "animate-spin" : ""}`} />
            Create a new link
          </button>
          <p className="mt-2 text-[12px] leading-relaxed text-[#8a7e80] dark:text-white/45">
            Use this if you think someone else has your link. The old one stops working straight
            away, so you will need to subscribe again with the new one.
          </p>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={regenerate}
        title="Create a new calendar link?"
        description="Your current link will stop working immediately. Any calendar app already using it will stop updating until you subscribe again with the new link."
        confirmLabel="Create new link"
        loading={regenerating}
        tone="danger"
      />
    </div>
  );
}
