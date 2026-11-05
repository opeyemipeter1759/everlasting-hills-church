"use client";

import { useState } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { SESSION_TOPICS, type HostSummary, type SessionTopic } from "@/lib/api/one-on-one";
import { FOUND_VIA, useCreateVisitorRequest, type FoundVia } from "@/lib/api/one-on-one-public";
import { errorText } from "@/components/pray-watch/shared";
import { btnPrimary, input } from "@/components/dashboard/one-on-one/manage/ui";
import { formatWhenLong } from "@/components/dashboard/one-on-one/member/parts";

const chip = (on: boolean) =>
  `rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
    on
      ? "border-[#87102C] bg-[#FFE8ED] text-[#87102C] dark:bg-[#87102C]/30 dark:text-[#FFB3C1]"
      : "border-[#E7CDD3] text-[#3B2A2E] hover:bg-[#FFE8ED]/50 dark:border-white/10 dark:text-white/75"
  }`;

export default function VisitorRequestForm({
  host,
  sessionTypeId,
  slot,
  timeZone,
  onBack,
  onSent,
  viaIntake = false,
}: {
  host: HostSummary;
  sessionTypeId: string;
  slot: { startsAt: string; endsAt: string };
  timeZone: string;
  onBack: () => void;
  onSent: (email: string) => void;
  /** Made on the general page, where no pastor is named. */
  viaIntake?: boolean;
}) {
  const create = useCreateVisitorRequest();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [foundVia, setFoundVia] = useState<FoundVia | null>(null);
  const [topic, setTopic] = useState<SessionTopic | null>(null);
  const [note, setNote] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const type = host.sessionTypes.find((t) => t.id === sessionTypeId);
  const askTopic = type?.askTopic ?? true;
  const pastorName = viaIntake ? "the pastor" : host.displayName;

  const ready = fullName.trim() && email.trim() && phone.trim() && location.trim() && foundVia && (!askTopic || topic);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || !foundVia || (askTopic && !topic)) return;
    setError(null);
    try {
      await create.mutateAsync({
        hostId: host.id,
        sessionTypeId,
        startsAt: slot.startsAt,
        topic: askTopic && topic ? topic : undefined,
        note: host.notesEnabled ? note.trim() || undefined : undefined,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        location: location.trim(),
        foundVia,
        timezone: timeZone,
        website: website || undefined,
        viaIntake,
      });
      onSent(email.trim());
    } catch (err) {
      setError(errorText(err, "Couldn't send your request. Please try again."));
    }
  }

  return (
    <form onSubmit={onSubmit} className="relative flex flex-col gap-6 overflow-hidden rounded-2xl border border-[#E7CDD3]/60 bg-white p-6 dark:border-white/[0.09] dark:bg-white/[0.05]">
      <div className="flex flex-col gap-2">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1 self-start text-sm font-semibold text-[#87102C] hover:underline dark:text-[#FFB3C1]">
          <ArrowLeft size={14} /> Change time
        </button>
        <p className="text-sm tabular-nums text-[#7A6A6F] dark:text-white/55">
          {formatWhenLong(slot.startsAt, slot.endsAt, timeZone)} your time · {type?.name} · {pastorName}
        </p>
        <h2 className="font-serif text-2xl font-bold text-[#111] dark:text-white">A little about you</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold text-[#111] dark:text-white">Full name</span>
          <input id="v-name" className={input} value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" maxLength={120} required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold text-[#111] dark:text-white">Email</span>
          <input id="v-email" type="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={254} required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold text-[#111] dark:text-white">WhatsApp or phone number</span>
          <input id="v-phone" type="tel" className={input} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="+234 …" maxLength={40} required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold text-[#111] dark:text-white">Where you live</span>
          <input id="v-location" className={input} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, country" maxLength={120} required />
        </label>
      </div>

      <fieldset>
        <legend className="mb-2.5 text-sm font-bold text-[#111] dark:text-white">How did you find us?</legend>
        <div className="flex flex-wrap gap-2">
          {FOUND_VIA.map((f) => (
            <button key={f} type="button" aria-pressed={foundVia === f} onClick={() => setFoundVia(f)} className={chip(foundVia === f)}>
              {f}
            </button>
          ))}
        </div>
      </fieldset>

      {askTopic && (
      <fieldset>
        <legend className="mb-2.5 text-sm font-bold text-[#111] dark:text-white">What would you like to talk about?</legend>
        <div className="flex flex-wrap gap-2">
          {SESSION_TOPICS.map((t) => (
            <button key={t} type="button" aria-pressed={topic === t} onClick={() => setTopic(t)} className={chip(topic === t)}>
              {t}
            </button>
          ))}
        </div>
      </fieldset>
      )}

      {host.notesEnabled && (
        <label className="flex flex-col gap-2">
          <span className="text-sm font-bold text-[#111] dark:text-white">{askTopic ? `Anything you’d like ${pastorName} to know beforehand (optional)` : `What would you like ${pastorName} to be aware of ahead of the session? (optional)`}</span>
          <textarea id="v-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1500} rows={4} className={`${input} resize-y`} />
          <span className="flex items-center gap-1.5 text-xs text-[#7A6A6F] dark:text-white/50">
            <Lock size={12} aria-hidden="true" /> {viaIntake ? "Only the pastors handling your request can read this." : `Only ${pastorName} can read this.`} It’s stored encrypted.
          </span>
        </label>
      )}

      <p className="rounded-xl bg-[#FDF3F5] px-4 py-3 text-sm text-[#3B2A2E] dark:bg-white/[0.05] dark:text-white/75">
        Wherever you are, {pastorName} will let you know whether you’ll meet by video call, by phone, or in person if you’re near Ibadan.
      </p>

      {/* Left empty by people; bots that fill every field give themselves away. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 dark:bg-red-500/10 dark:text-red-200">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <button type="submit" className={`${btnPrimary} self-start`} disabled={!ready || create.isPending}>
          {create.isPending ? "Sending…" : "Send request"}
        </button>
        <span className="text-xs text-[#7A6A6F] dark:text-white/50">We’ll email you a link to confirm. Nothing is booked until {pastorName} approves it.</span>
      </div>
    </form>
  );
}
