"use client";

import Link from "next/link";
import { Clock3, Send, MessageCircle } from "lucide-react";
import { useIsLoggedIn } from "@/components/home/NavUserBadge";
import { usePublicPrayerWatch, useMyPrayerSignup, type PublicSlot } from "@/lib/api/prayer-watch";
import { PWLoading, PWError } from "./shared";

const DASHBOARD_PATH = "/dashboard/prayer-watch";

function timeRange(s: PublicSlot) {
  const fmt = (t: string) => {
    const [h] = t.split(":").map(Number);
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}${h < 12 || h === 24 ? "am" : "pm"}`;
  };
  return `${fmt(s.startTime)} – ${fmt(s.endTime)}`;
}

/**
 * Shows the schedule and lets a visitor see what's open, but the sign-up
 * itself happens in the member dashboard — one canonical place to apply,
 * manage a pending application, and later request a change or add a
 * reflection, rather than a second form duplicated here.
 */
export default function PublicSignupWidget() {
  const isLoggedIn = useIsLoggedIn();
  const watch = usePublicPrayerWatch();
  const mine = useMyPrayerSignup({ enabled: isLoggedIn === true });

  if (watch.isLoading) return <PWLoading />;
  if (watch.isError) return <PWError error={watch.error} onRetry={() => watch.refetch()} />;

  // Signed in with an existing sign-up: show status, not a redundant prompt.
  if (isLoggedIn === true && mine.data) {
    const { signup, slot, telegramLink } = mine.data;
    if (signup.status === "PENDING") {
      return (
        <div className="pw-ink rounded-[22px] p-7 text-center">
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/70">
            <Clock3 size={14} aria-hidden="true" /> Awaiting approval
          </p>
          <p className="pw-display mt-3 text-2xl">{slot.label} — {slot.startTime}–{slot.endTime}</p>
          <p className="mx-auto mt-3 max-w-sm text-sm text-white/65">
            An admin reviews every sign-up before it&apos;s confirmed. We&apos;ll email you as soon as it is.
          </p>
        </div>
      );
    }
    return (
      <div className="pw-ink rounded-[22px] p-7 text-center">
        <p className="text-sm font-semibold text-white/70">You&apos;re on the watch</p>
        <p className="pw-display mt-3 text-2xl">{slot.label} — {slot.startTime}–{slot.endTime}</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {telegramLink && (
            <a href={telegramLink} target="_blank" rel="noopener noreferrer" className="pw-btn pw-btn-primary">
              <Send size={16} aria-hidden="true" /> Join the Telegram channel
            </a>
          )}
          {slot.whatsappLink && (
            <a href={slot.whatsappLink} target="_blank" rel="noopener noreferrer" className="pw-btn pw-btn-glass">
              <MessageCircle size={16} aria-hidden="true" /> Join your watch family
            </a>
          )}
        </div>
        <p className="mt-6 text-sm text-white/55">
          <Link href={DASHBOARD_PATH} className="underline hover:text-white">Manage your Prayer Watch</Link>, including reflections and requesting a change.
        </p>
      </div>
    );
  }

  const watches = watch.data?.slots ?? [];
  const ctaHref = isLoggedIn === true ? DASHBOARD_PATH : `/login?next=${encodeURIComponent(DASHBOARD_PATH)}`;
  const ctaLabel = isLoggedIn === true ? "Sign up in your dashboard" : "Sign in to sign up";

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {watches.map((s, i) => {
          const full = s.spotsLeft <= 0;
          return (
            <div
              key={s.id}
              data-watch={i + 1}
              className={`flex min-h-[140px] flex-col justify-between rounded-[20px] p-5 ${full ? "opacity-40" : ""}`}
            >
              <span className="text-sm font-semibold opacity-80">{timeRange(s)}</span>
              <span className="pw-display mt-2 text-xl">{s.label}</span>
              {full && <span className="mt-1 text-xs font-semibold opacity-80">Full</span>}
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <Link href={ctaHref} className="pw-btn pw-btn-primary">
          {ctaLabel}
        </Link>
        <p className="mt-3 text-sm text-black/55">
          {isLoggedIn === true
            ? "Pick your hour and apply from your dashboard."
            : "Sign in (or create an account) to pick your hour — that's also where you'll see whether it's been approved."}
        </p>
      </div>
    </div>
  );
}
