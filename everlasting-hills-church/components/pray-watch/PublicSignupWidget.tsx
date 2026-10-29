"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Clock3, Send, MessageCircle } from "lucide-react";
import { useMe } from "@/lib/api";
import { useIsLoggedIn } from "@/components/home/NavUserBadge";
import { userMessageForError } from "@/lib/api/user-message";
import { showToast } from "@/components/ui/toast/toast";
import { usePublicPrayerWatch, useMyPrayerSignup, useSubmitPrayerSignup, type PublicSlot } from "@/lib/api/prayer-watch";
import { PWLoading, PWError, errorText } from "./shared";

const fieldCls =
  "min-h-11 w-full rounded-lg border border-[var(--color-paper-line)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-black/35 outline-none transition-colors focus:border-black/30";

function timeRange(s: PublicSlot) {
  const fmt = (t: string) => {
    const [h] = t.split(":").map(Number);
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}${h < 12 || h === 24 ? "am" : "pm"}`;
  };
  return `${fmt(s.startTime)} – ${fmt(s.endTime)}`;
}

export default function PublicSignupWidget() {
  const isLoggedIn = useIsLoggedIn();
  const watch = usePublicPrayerWatch();
  const me = useMe({ enabled: isLoggedIn === true });
  const mine = useMyPrayerSignup({ enabled: isLoggedIn === true });
  const submit = useSubmitPrayerSignup();
  const profile = me.data?.member;

  const [slotId, setSlotId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isWorker, setIsWorker] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(false);

  const knownName = useMemo(() => [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim(), [profile]);

  useEffect(() => {
    if (prefilled || !profile) return;
    setFullName(knownName);
    setEmail(profile.email ?? "");
    setPhone(profile.phone ?? "");
    setIsWorker(Boolean(profile.units?.length));
    setPrefilled(true);
  }, [profile, knownName, prefilled]);

  if (watch.isLoading) return <PWLoading />;
  if (watch.isError) return <PWError error={watch.error} onRetry={() => watch.refetch()} />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!slotId) return setError("Choose a watch hour.");
    if (!fullName.trim() || !phone.trim() || !email.trim()) return setError("Please fill in your name, phone and email.");
    if (!agreed) return setError("Please confirm you'll be committed to this watch hour.");

    try {
      await submit.mutateAsync({ slotId, fullName: fullName.trim(), phone: phone.trim(), email: email.trim(), isWorker });
      showToast.success("Sign-up received — an admin will confirm it shortly.");
    } catch (err) {
      setError(userMessageForError(err, "Couldn't complete your sign-up. Please try again."));
      watch.refetch();
    }
  }

  // Signed in with an existing sign-up: show status, not the form again.
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
          <Link href="/dashboard/prayer-watch" className="underline hover:text-white">Manage your Prayer Watch</Link>, including reflections and requesting a change.
        </p>
      </div>
    );
  }

  const watches = watch.data?.slots ?? [];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {watches.map((s) => {
          const full = s.spotsLeft <= 0;
          const selected = s.id === slotId;
          return (
            <button
              key={s.id}
              type="button"
              data-watch={watches.indexOf(s) + 1}
              disabled={full}
              onClick={() => setSlotId(s.id)}
              aria-pressed={selected}
              className={`flex flex-col justify-between rounded-[20px] p-5 text-left transition-opacity min-h-[140px] ${
                full ? "cursor-not-allowed opacity-40" : selected ? "ring-2 ring-[var(--color-flame)] ring-offset-2 ring-offset-[var(--color-paper)]" : ""
              }`}
            >
              <span className="text-sm font-semibold opacity-80">{timeRange(s)}</span>
              <span className="pw-display mt-2 text-xl">{s.label}</span>
              {full && <span className="mt-1 text-xs font-semibold opacity-80">Full</span>}
            </button>
          );
        })}
      </div>

      {prefilled && (!fullName.trim() || !phone.trim() || !email.trim()) && (
        <p className="text-sm text-black/55">
          A few details are missing from your profile. Fill them in below, or{" "}
          <Link href="/dashboard/profile" className="font-semibold underline">update your profile</Link> first.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className={fieldCls} />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" className={fieldCls} />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={`${fieldCls} sm:col-span-2`} />
      </div>

      <label className="flex items-start gap-2.5 text-sm text-black/70">
        <input type="checkbox" checked={isWorker} onChange={(e) => setIsWorker(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0" />
        I serve in a unit or department at EHC
      </label>

      <label className="flex items-start gap-2.5 text-sm text-black/70">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0" />
        I agree to be committed to this prayer watch hour
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={submit.isPending} className="pw-btn pw-btn-primary w-full">
        {submit.isPending ? "Signing up…" : "Sign up for this watch"}
      </button>
    </form>
  );
}
