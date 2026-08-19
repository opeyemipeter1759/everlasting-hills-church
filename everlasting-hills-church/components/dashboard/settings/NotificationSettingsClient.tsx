"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, BellOff, Send, Share, Smartphone } from "lucide-react";
import { apiClient } from "@/lib/api/axios";
import {
  getPermissionState,
  hasActiveSubscription,
  requestAndSubscribe,
  unsubscribeCurrentDevice,
  type PermissionState,
} from "@/lib/pwa/push";

const EASE = [0.22, 1, 0.36, 1] as const;

type Category =
  | "serviceStarting"
  | "serviceReminder"
  | "servingReminder"
  | "prayerMeeting"
  | "announcements"
  | "unitAnnouncements"
  | "newSermon"
  | "milestones";

interface Preferences extends Record<Category, boolean> {
  quietStart: string | null;
  quietEnd: string | null;
  timezone: string;
}

const CATEGORIES: { key: Category; label: string; help: string }[] = [
  {
    key: "serviceStarting",
    label: "Service starting",
    help: "When a service opens and you can check in.",
  },
  {
    key: "serviceReminder",
    label: "Service reminder",
    help: "The day before a scheduled service.",
  },
  {
    key: "servingReminder",
    label: "Serving reminder",
    help: "Two days before a service you are rostered for.",
  },
  {
    key: "prayerMeeting",
    label: "Daily prayer meeting",
    help: "At the start of the online prayer meeting each day.",
  },
  {
    key: "announcements",
    label: "Church announcements",
    help: "News that goes out to the whole church.",
  },
  {
    key: "unitAnnouncements",
    label: "Unit and department news",
    help: "Only from the groups you belong to.",
  },
  { key: "newSermon", label: "New sermons", help: "When a sermon is published." },
  {
    key: "milestones",
    label: "Personal milestones",
    help: "Your birthday and attendance milestones.",
  },
];

export default function NotificationSettingsClient() {
  const [permission, setPermission] = useState<PermissionState>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [saving, setSaving] = useState<Category | "quiet" | null>(null);
  const [testState, setTestState] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPermission(getPermissionState());
    void hasActiveSubscription().then(setSubscribed);

    (async () => {
      try {
        const res = await apiClient.get("/push/preferences");
        setPrefs((res.data?.data ?? res.data) as Preferences);
      } catch {
        setError("We could not load your notification settings.");
      }
    })();
  }, []);

  /**
   * Toggling a category is what triggers the permission request, never page
   * load. The member has just told us what they want to be notified about, so
   * the browser prompt arrives with obvious context.
   */
  const toggle = useCallback(
    async (key: Category, next: boolean) => {
      if (!prefs) return;
      setError(null);
      setSaving(key);

      // Turning something on with no permission yet: ask now.
      if (next && permission === "default") {
        const result = await requestAndSubscribe();
        setPermission(result);
        if (result !== "granted") {
          setSaving(null);
          return;
        }
        setSubscribed(true);
      }

      const previous = prefs[key];
      setPrefs({ ...prefs, [key]: next });
      try {
        await apiClient.patch("/push/preferences", { [key]: next });
      } catch {
        setPrefs({ ...prefs, [key]: previous });
        setError("That change did not save. Please try again.");
      } finally {
        setSaving(null);
      }
    },
    [permission, prefs],
  );

  const saveQuietHours = useCallback(
    async (start: string | null, end: string | null) => {
      if (!prefs) return;
      setSaving("quiet");
      setError(null);
      const previous = { quietStart: prefs.quietStart, quietEnd: prefs.quietEnd };
      setPrefs({ ...prefs, quietStart: start, quietEnd: end });
      try {
        await apiClient.patch("/push/preferences", { quietStart: start, quietEnd: end });
      } catch {
        setPrefs({ ...prefs, ...previous });
        setError("Quiet hours did not save. Please try again.");
      } finally {
        setSaving(null);
      }
    },
    [prefs],
  );

  async function sendTest() {
    setTestState("sending");
    try {
      await apiClient.post("/push/test");
      setTestState("sent");
      window.setTimeout(() => setTestState("idle"), 4000);
    } catch {
      setTestState("failed");
      window.setTimeout(() => setTestState("idle"), 4000);
    }
  }

  return (
    <div className="space-y-6">
      <motion.header
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
      >
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#87102C]/80 dark:text-white/40">
          Member Portal
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-[#111] dark:text-white">
          Notifications
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#8a7e80] dark:text-white/50">
          Choose what you hear about. You can change any of this at any time, and turning something
          off takes effect straight away.
        </p>
      </motion.header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      <PermissionBanner permission={permission} subscribed={subscribed} />

      {/* Toggles are shown unless the platform genuinely cannot deliver, so a
          member can set preferences before granting permission. */}
      {permission !== "unsupported" && permission !== "ios-needs-install" && (
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease: EASE }}
          className="rounded-2xl border border-[#E7CDD3]/60 bg-white shadow-[0_1px_2px_rgba(135,16,44,0.04)] dark:border-white/[0.09] dark:bg-white/[0.05] dark:shadow-none"
        >
          <div className="border-b border-[#E7CDD3]/40 px-6 pb-5 pt-7 dark:border-white/[0.07] sm:px-8">
            <h2 className="text-[15px] font-bold text-[#111] dark:text-white">What to send</h2>
          </div>

          <div className="divide-y divide-[#E7CDD3]/30 dark:divide-white/[0.06]">
            {CATEGORIES.map((category) => (
              <div
                key={category.key}
                className="flex items-start justify-between gap-4 px-6 py-4 sm:px-8"
              >
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-[#111] dark:text-white">
                    {category.label}
                  </p>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-[#8a7e80] dark:text-white/45">
                    {category.help}
                  </p>
                </div>
                <Toggle
                  checked={prefs?.[category.key] ?? false}
                  disabled={!prefs || saving === category.key || permission === "denied"}
                  onChange={(next) => toggle(category.key, next)}
                  label={category.label}
                />
              </div>
            ))}
          </div>

          <QuietHours
            start={prefs?.quietStart ?? null}
            end={prefs?.quietEnd ?? null}
            timezone={prefs?.timezone ?? "Africa/Lagos"}
            saving={saving === "quiet"}
            disabled={!prefs || permission === "denied"}
            onSave={saveQuietHours}
          />

          {permission === "granted" && (
            <div className="border-t border-[#E7CDD3]/40 px-6 py-5 dark:border-white/[0.07] sm:px-8">
              <button
                type="button"
                onClick={sendTest}
                disabled={testState === "sending"}
                className="inline-flex items-center gap-2 rounded-xl border border-[#E7CDD3] px-4 py-2.5 text-sm font-semibold text-[#5A4A4D] transition-colors hover:bg-[#FFF4F6] disabled:opacity-50 dark:border-white/[0.14] dark:text-white/70 dark:hover:bg-white/[0.07]"
              >
                <Send className="h-4 w-4" />
                {testState === "sending"
                  ? "Sending..."
                  : testState === "sent"
                    ? "Sent, check your device"
                    : testState === "failed"
                      ? "That did not send"
                      : "Send me a test notification"}
              </button>
            </div>
          )}
        </motion.section>
      )}
    </div>
  );
}

/**
 * The permission state banner. Each state gets its own message because the
 * member's next action is different in each one, and a denied member in
 * particular cannot be helped by anything the app does — only by browser
 * settings.
 */
function PermissionBanner({
  permission,
  subscribed,
}: {
  permission: PermissionState;
  subscribed: boolean;
}) {
  if (permission === "granted" && subscribed) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
        <Bell className="mt-0.5 h-[18px] w-[18px] shrink-0 text-emerald-600 dark:text-emerald-400" />
        <p className="text-[13.5px] leading-relaxed text-emerald-800 dark:text-emerald-300">
          Notifications are on for this device.
        </p>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-[#E7CDD3]/60 bg-[#FFF9FA] px-5 py-4 dark:border-white/[0.09] dark:bg-white/[0.04]">
        <BellOff className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#87102C] dark:text-[#FFB3C1]" />
        <div>
          <p className="text-[13.5px] font-semibold text-[#111] dark:text-white">
            Notifications are blocked for this site
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-[#8a7e80] dark:text-white/50">
            We cannot ask again from here, so this has to be changed in your browser. Tap the icon
            beside the web address, find Notifications, and set it to Allow. Then come back and
            refresh this page.
          </p>
        </div>
      </div>
    );
  }

  if (permission === "ios-needs-install") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-[#E7CDD3]/60 bg-[#FFF9FA] px-5 py-4 dark:border-white/[0.09] dark:bg-white/[0.04]">
        <Smartphone className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#87102C] dark:text-[#FFB3C1]" />
        <div>
          <p className="text-[13.5px] font-semibold text-[#111] dark:text-white">
            Add the app to your home screen first
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-[#8a7e80] dark:text-white/50">
            On iPhone and iPad, notifications only work once this is installed as an app. Tap the
            Share button
            <Share className="mx-1 inline h-3.5 w-3.5 -translate-y-px" />
            in Safari, choose Add to Home Screen, then open it from there and come back to this
            page.
          </p>
        </div>
      </div>
    );
  }

  if (permission === "unsupported") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-[#E7CDD3]/60 bg-[#FFF9FA] px-5 py-4 dark:border-white/[0.09] dark:bg-white/[0.04]">
        <BellOff className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#8a7e80] dark:text-white/40" />
        <p className="text-[13.5px] leading-relaxed text-[#8a7e80] dark:text-white/50">
          This browser cannot receive notifications. Everything else still works, and you can add
          church events to your calendar instead.
        </p>
      </div>
    );
  }

  // default: can still ask
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[#E7CDD3]/60 bg-[#FFF9FA] px-5 py-4 dark:border-white/[0.09] dark:bg-white/[0.04]">
      <Bell className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#87102C] dark:text-[#FFB3C1]" />
      <p className="text-[13.5px] leading-relaxed text-[#8a7e80] dark:text-white/50">
        Turn on anything below and your browser will ask permission once. Nothing is sent until you
        choose something here.
      </p>
    </div>
  );
}

function QuietHours({
  start,
  end,
  timezone,
  saving,
  disabled,
  onSave,
}: {
  start: string | null;
  end: string | null;
  timezone: string;
  saving: boolean;
  disabled: boolean;
  onSave: (start: string | null, end: string | null) => void;
}) {
  const enabled = Boolean(start && end);

  return (
    <div className="border-t border-[#E7CDD3]/40 px-6 py-5 dark:border-white/[0.07] sm:px-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-[#111] dark:text-white">Quiet hours</p>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-[#8a7e80] dark:text-white/45">
            Hold everything except a service starting. Nothing is delivered afterwards in a batch,
            so a quiet night stays quiet. Times are {timezone.replace("_", " ")}.
          </p>
        </div>
        <Toggle
          checked={enabled}
          disabled={disabled || saving}
          label="Quiet hours"
          onChange={(next) => onSave(next ? "22:00" : null, next ? "06:00" : null)}
        />
      </div>

      {enabled && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-[13px] text-[#5A4A4D] dark:text-white/60">
            From
            <input
              type="time"
              value={start ?? ""}
              disabled={disabled || saving}
              onChange={(e) => onSave(e.target.value, end)}
              className="rounded-lg border border-[#E7CDD3] bg-white px-2.5 py-1.5 text-[13px] dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-white/80"
            />
          </label>
          <label className="flex items-center gap-2 text-[13px] text-[#5A4A4D] dark:text-white/60">
            To
            <input
              type="time"
              value={end ?? ""}
              disabled={disabled || saving}
              onChange={(e) => onSave(start, e.target.value)}
              className="rounded-lg border border-[#E7CDD3] bg-white px-2.5 py-1.5 text-[13px] dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-white/80"
            />
          </label>
        </div>
      )}
    </div>
  );
}

function Toggle({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-40 ${
        checked ? "bg-[#87102C]" : "bg-[#E7CDD3] dark:bg-white/15"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
