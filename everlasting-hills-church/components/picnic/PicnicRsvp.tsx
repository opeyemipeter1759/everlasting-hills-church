"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, CircleNotch, Icon } from "@/components/icons";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { apiClient } from "@/lib/api/axios";
import { PICNIC } from "./picnic-config";
import { primaryBtn } from "./picnic-styles";
import Countdown from "./PicnicCountdown";
import PicnicHeadcount from "./PicnicHeadcount";

/** Remembers on this device that someone registered, so a revisit shows "you're in". */
export const RSVP_STORAGE_KEY = "ehc-picnic-rsvp";

interface Saved {
  fullName: string;
  attendees: number;
}

const field =
  "w-full rounded-xl border border-[#F7F0E3]/20 bg-[#F7F0E3]/[0.06] px-4 py-3 text-[15px] text-[#F7F0E3] placeholder:text-[#F7F0E3]/40 focus:border-[#F7F0E3]/70 focus:outline-none focus:ring-2 focus:ring-[#F7F0E3]/20";
const label = "mb-1.5 block text-sm font-medium text-[#F7F0E3]/80";

/**
 * Open registration — anyone can sign up, no account needed. Saved as an RSVP on
 * the "ehc-picnic" event, so the list lives in Dashboard → Events → RSVPs.
 */
export default function PicnicRsvp({ fallbackDate }: { fallbackDate: string }) {
  const user = useCurrentUser();
  const [saved, setSaved] = useState<Saved | null>(null);
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", attendees: 1 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RSVP_STORAGE_KEY);
      if (raw) setSaved(JSON.parse(raw) as Saved);
    } catch {
      /* private mode — just show the form */
    }
  }, []);

  // Signed-in members: start from what we already know.
  useEffect(() => {
    if (!user?.loggedIn) return;
    setForm((f) => ({ ...f, fullName: f.fullName || user.fullName || "", email: f.email || user.email || "" }));
  }, [user]);

  const set = (k: keyof typeof form, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiClient.post(`/events/${PICNIC.eventSlug}/rsvp`, {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        attendees: form.attendees,
      });
      const next = { fullName: form.fullName.trim(), attendees: form.attendees };
      setSaved(next);
      try {
        localStorage.setItem(RSVP_STORAGE_KEY, JSON.stringify(next));
        window.dispatchEvent(new Event(RSVP_STORAGE_KEY));
      } catch {
        /* ignore */
      }
    } catch (err) {
      setError((err as { message?: string }).message ?? "We couldn't save your spot. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (saved) {
    const first = saved.fullName.split(/\s+/)[0];
    return (
      <div>
        <Countdown target={fallbackDate} />
        <p className="mt-8 flex items-center gap-3 font-serif text-2xl text-[#F7F0E3]">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F0E3] text-[#1E3A2A]">
            <Icon icon={Check} size={18} weight="bold" />
          </span>
          You&apos;re on the list, {first}.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-[#F7F0E3]/70">
          {saved.attendees > 1 ? `Spots saved for ${saved.attendees} people.` : "Your spot is saved."} Now tell your
          people below.
        </p>
        <button
          type="button"
          onClick={() => {
            setSaved(null);
            setForm({ fullName: "", phone: "", email: "", attendees: 1 });
          }}
          className="mt-5 text-sm text-[#F7F0E3]/65 underline decoration-[#F7F0E3]/30 underline-offset-4 hover:text-[#F7F0E3]"
        >
          Register someone else
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <Countdown target={fallbackDate} />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="picnic-name" className={label}>Full name</label>
          <input id="picnic-name" required maxLength={120} autoComplete="name" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Adaeze Okafor" className={field} />
        </div>
        <div>
          <label htmlFor="picnic-phone" className={label}>WhatsApp number</label>
          <input id="picnic-phone" required type="tel" maxLength={40} autoComplete="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="0803 000 0000" className={field} />
        </div>
        <div>
          <label htmlFor="picnic-email" className={label}>Email</label>
          <input id="picnic-email" required type="email" maxLength={200} autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" className={field} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="picnic-count" className={label}>How many of you are coming?</label>
          <PicnicHeadcount id="picnic-count" value={form.attendees} onChange={(n) => set("attendees", n)} className={field} />
        </div>
      </div>
      <button type="submit" disabled={busy} className={`${primaryBtn} mt-7 w-full sm:w-auto`}>
        {busy && <Icon icon={CircleNotch} size={16} className="animate-spin" />}
        {busy ? "Saving your spot…" : "Count me in"}
        {!busy && <Icon icon={ArrowRight} size={16} />}
      </button>
      <p className="mt-4 text-xs text-[#F7F0E3]/55">We only use these details to plan the day and reach you about it.</p>
      {error && <p role="alert" className="mt-3 text-sm text-[#FFB4A8]">{error}</p>}
    </form>
  );
}
