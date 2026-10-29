"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarPlus, Clock3, Loader2, MessageCircle, Send, Users } from "lucide-react";
import { fraunces } from "@/lib/fonts/prayer-watch";
import { userMessageForError } from "@/lib/api/user-message";
import {
  myPrayerWatchIcsHref,
  useAddReflection,
  useMyPrayerHistory,
  useMyPrayerSignup,
  usePublicPrayerWatch,
  useRequestFamilyChange,
  useSlotCompanions,
  useSubmitPrayerSignup,
  type PastWatch,
  type PublicSlot,
} from "@/lib/api/prayer-watch";
import { useMe } from "@/lib/api";

const serif = { fontFamily: "var(--font-fraunces), serif" };

const fieldCls =
  "min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#111] placeholder:text-gray-400 outline-none transition-colors focus:border-[#87102C]/50 focus:ring-1 focus:ring-[#87102C]/20 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/30 dark:focus:border-[#FFB3C1]/50 dark:focus:ring-[#FFB3C1]/20";

/** Each watch hour takes its colour from the real sky at that time — dusk,
 * deep indigo, the void before dawn, first light — so colour carries the
 * schedule itself instead of decorating four otherwise-identical rows. */
const WATCH_COLORS = [
  { bg: "#4F2E5E", text: "#fff", sub: "rgba(255,255,255,0.7)", bar: "rgba(255,255,255,0.25)" },
  { bg: "#232C52", text: "#fff", sub: "rgba(255,255,255,0.7)", bar: "rgba(255,255,255,0.25)" },
  { bg: "#0A0E1F", text: "#fff", sub: "rgba(255,255,255,0.7)", bar: "rgba(255,255,255,0.25)" },
  { bg: "#C97A3E", text: "#150E22", sub: "rgba(21,14,34,0.62)", bar: "rgba(21,14,34,0.18)" },
] as const;
const SKY_GRADIENT = `linear-gradient(90deg, ${WATCH_COLORS[0].bg}, ${WATCH_COLORS[1].bg} 38%, ${WATCH_COLORS[2].bg} 62%, ${WATCH_COLORS[3].bg})`;

function watchColorFor(slots: PublicSlot[] | undefined, slotId: string | undefined) {
  if (!slots || !slotId) return null;
  const i = slots.findIndex((s) => s.id === slotId);
  return i === -1 ? null : WATCH_COLORS[i % WATCH_COLORS.length];
}

/** The watch hours themselves are the picker — no separate dropdown duplicating the same choice. */
function WatchHourPicker({ slots, value, onChange, disabled }: { slots: PublicSlot[]; value: string; onChange: (id: string) => void; disabled?: boolean }) {
  return (
    <div role="radiogroup" aria-label="Prayer watch hour" className="grid gap-3 xs:grid-cols-2">
      {slots.map((s, i) => {
        const full = s.spotsLeft <= 0;
        const filled = Math.min(1, Math.max(0, (s.capacity - s.spotsLeft) / s.capacity));
        const selected = s.id === value;
        const c = WATCH_COLORS[i % WATCH_COLORS.length];
        return (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={full || disabled}
            onClick={() => onChange(s.id)}
            style={full ? undefined : { background: c.bg, color: c.text }}
            className={`flex min-h-[112px] flex-col justify-between rounded-2xl p-4 text-left transition-all ${
              full
                ? "cursor-not-allowed border border-dashed border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/[0.02]"
                : selected
                  ? "ring-2 ring-[#E7B454] ring-offset-2 ring-offset-white dark:ring-offset-[#0b0712]"
                  : "opacity-[0.92] hover:opacity-100"
            }`}
          >
            <span style={serif} className={`block text-xl font-medium tabular-nums sm:text-2xl ${full ? "text-gray-400 dark:text-white/30" : ""}`}>
              {s.startTime}
              <span className="mx-1 opacity-50">–</span>
              {s.endTime}
            </span>
            <span>
              <span className="block text-xs font-semibold" style={full ? undefined : { color: c.sub }}>
                {s.label}
                {full && <span className="text-gray-400 dark:text-white/40"> · Full</span>}
              </span>
              {!full && (
                <span className="mt-2 block h-1 overflow-hidden rounded-full" style={{ background: c.bar }}>
                  <span className="block h-full rounded-full bg-white/80" style={{ width: `${filled * 100}%` }} />
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** "N others are on this hour" — the shared-vigil nudge, never names beyond first names. */
function Companions({ slotId, className = "justify-start text-gray-500 dark:text-white/45" }: { slotId: string | null; className?: string }) {
  const companions = useSlotCompanions(slotId);
  if (!slotId || companions.isLoading || !companions.data || companions.data.count === 0) return null;
  const { count, firstNames } = companions.data;
  const shown = firstNames.slice(0, 3).join(", ");
  const rest = count - Math.min(3, firstNames.length);
  return (
    <p className={`mt-2 flex items-center gap-1.5 text-xs ${className}`}>
      <Users size={13} className="shrink-0" aria-hidden="true" />
      {shown}
      {rest > 0 ? ` and ${rest} other${rest === 1 ? "" : "s"}` : ""} already on this hour.
    </p>
  );
}

function formatEntryDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function PastWatchCard({ item }: { item: PastWatch }) {
  const addReflection = useAddReflection();
  const [draft, setDraft] = useState("");

  async function save() {
    const body = draft.trim();
    if (!body) return;
    await addReflection.mutateAsync({ id: item.signupId, body });
    setDraft("");
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3.5 xs:p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <p className="text-sm font-semibold text-[#111] dark:text-white">{item.watchTitle}</p>
      <p className="text-xs text-gray-500 dark:text-white/45">
        {item.watchDate} · {item.slotLabel} · {item.slotTime}
      </p>

      {item.reflections.length > 0 && (
        <div className="mt-3 space-y-2.5">
          {item.reflections.map((r) => (
            <div key={r.id} className="border-l-2 border-[#87102C]/20 pl-3 dark:border-[#FFB3C1]/20">
              <p className="text-sm leading-relaxed text-gray-700 dark:text-white/75">{r.body}</p>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-white/35">{formatEntryDate(r.createdAt)}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="What did God say during your watch hour?"
          rows={2}
          className={`${fieldCls} resize-none`}
        />
        <button
          type="button"
          onClick={save}
          disabled={addReflection.isPending || !draft.trim()}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-[#87102C] px-3.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {addReflection.isPending && <Loader2 size={12} className="animate-spin" />}
          {item.reflections.length > 0 ? "Add another" : "Save"}
        </button>
      </div>
    </div>
  );
}

export default function PrayerWatchScreen() {
  const watch = usePublicPrayerWatch();
  const submit = useSubmitPrayerSignup();
  const me = useMe();
  const mine = useMyPrayerSignup();
  const requestChange = useRequestFamilyChange();
  const history = useMyPrayerHistory();
  const profile = me.data?.member;

  const knownName = useMemo(() => [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim(), [profile]);
  const isWorker = useMemo(
    () =>
      Boolean(profile?.units?.length) ||
      Boolean(me.data?.headUsher) ||
      Boolean(me.data?.unitLeadOf?.length) ||
      Boolean(me.data?.hodOf?.length),
    [profile, me.data],
  );

  const [slotId, setSlotId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(false);
  const [requestingChange, setRequestingChange] = useState(false);
  const [requestSlotId, setRequestSlotId] = useState("");
  const [requestReason, setRequestReason] = useState("");

  useEffect(() => {
    if (prefilled || !profile) return;
    setFullName(knownName);
    setEmail(profile.email ?? "");
    setPhone(profile.phone ?? "");
    setPrefilled(true);
  }, [profile, knownName, prefilled]);

  // Only ask for what the member's own profile doesn't already tell us.
  const needsName = prefilled && !knownName;
  const needsEmail = prefilled && !profile?.email;
  const needsPhone = prefilled && !profile?.phone;
  const hasMissingField = needsName || needsEmail || needsPhone;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!slotId) return setError("Choose a prayer watch hour.");
    if (!fullName.trim() || !phone.trim() || !email.trim()) return setError("We're missing some of your details — please fill them in below.");
    if (!agreed) return setError("Please confirm you'll be committed to this prayer watch hour.");

    try {
      await submit.mutateAsync({ slotId, fullName: fullName.trim(), phone: phone.trim(), email: email.trim(), isWorker });
    } catch (err) {
      setError(userMessageForError(err, "Couldn't complete your sign-up. Please try again."));
      watch.refetch();
    }
  }

  async function handleRequestChange() {
    if (!mine.data || !requestSlotId) return;
    setError(null);
    try {
      await requestChange.mutateAsync({ id: mine.data.signup.id, toSlotId: requestSlotId, reason: requestReason.trim() || undefined });
      setRequestingChange(false);
      setRequestSlotId("");
      setRequestReason("");
    } catch (err) {
      setError(userMessageForError(err, "Couldn't send your request. Please try again."));
    }
  }

  const historyList = history.data ?? [];

  return (
    <div className={`${fraunces.variable} mx-auto max-w-2xl py-6 sm:py-8`}>
      <span aria-hidden="true" className="block h-1.5 w-16 rounded-full" style={{ background: SKY_GRADIENT }} />
      <h1 style={serif} className="mt-4 text-2xl font-medium text-[#111] dark:text-white xs:text-3xl sm:text-4xl">
        {watch.data?.title ?? "Prayer Watch"}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-white/60">
        Monday to Saturday, 10 PM to 6 AM, Everlasting Hills keeps an unbroken watch of prayer — eight hours, split into
        four two-hour watches. Sundays are kept for our corporate service. Every member is expected to commit to at
        least one two-hour watch daily.
      </p>

      <div className="relative mt-5 overflow-hidden rounded-2xl border border-[#E7CDD3]/60 bg-[#FFF4F6]/50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px]" style={{ background: SKY_GRADIENT }} />
        <p style={serif} className="text-sm italic leading-relaxed text-[#6E0C24] dark:text-[#FFB3C1] sm:text-base">
          &ldquo;I have set watchmen upon thy walls, O Jerusalem, which shall never hold their peace day nor night:
          ye that make mention of the LORD, keep not silence, and give Him no rest, till He establish, and till He
          make Jerusalem a praise in the earth.&rdquo;
        </p>
        <p className="mt-2 text-xs font-medium text-[#87102C]/70 dark:text-[#FFB3C1]/70">Isaiah 62:6–7, KJV</p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <Clock3 size={16} className="text-[#C97A3E]" aria-hidden="true" />
          <p className="mt-2 text-sm font-semibold text-[#111] dark:text-white">Prayer Watch</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-white/50">
            The two-hour window itself — where you join the others praying that hour on Telegram.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <Users size={16} className="text-[#C97A3E]" aria-hidden="true" />
          <p className="mt-2 text-sm font-semibold text-[#111] dark:text-white">Prayer Watchmen Family</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-white/50">
            The WhatsApp community of everyone on your watch hour — your committed prayer family for fellowship,
            encouragement, and accountability, not just the two hours.
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-gray-500 dark:text-white/45">
        Life happens — if your usual hour doesn&apos;t work on a given day, you&apos;re free to pray along with any
        other active watch on Telegram. Your Prayer Watchmen Family stays the same either way. The hour you choose
        below becomes that family.
      </p>

      {watch.isLoading || me.isLoading || mine.isLoading ? (
        <div className="mt-8 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
          ))}
        </div>
      ) : watch.isError ? (
        <p className="mt-8 text-sm text-red-600 dark:text-red-400">Could not load the watch schedule. Please refresh.</p>
      ) : mine.data && mine.data.signup.status === "PENDING" ? (
        <div className="mt-8">
          <div
            className="relative overflow-hidden rounded-2xl p-5 text-center xs:p-6"
            style={{ background: watchColorFor(watch.data?.slots, mine.data.slot.id)?.bg ?? "#150E22", color: watchColorFor(watch.data?.slots, mine.data.slot.id)?.text ?? "#fff" }}
          >
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold opacity-70">
              <Clock3 size={13} aria-hidden="true" />
              Awaiting approval
            </p>
            <h2 style={serif} className="mt-2 text-2xl font-medium xs:text-3xl sm:text-4xl">
              {mine.data.slot.startTime}–{mine.data.slot.endTime}
            </h2>
            <p className="mt-1 text-sm opacity-70">{mine.data.slot.label}</p>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed opacity-80">
              An admin reviews every sign-up before it&apos;s confirmed. We&apos;ll email you as soon as it is.
            </p>
          </div>
        </div>
      ) : mine.data ? (
        <div className="mt-8">
          <div
            className="relative overflow-hidden rounded-2xl p-5 text-center xs:p-6"
            style={{ background: watchColorFor(watch.data?.slots, mine.data.slot.id)?.bg ?? "#150E22", color: watchColorFor(watch.data?.slots, mine.data.slot.id)?.text ?? "#fff" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">You&apos;re on the watch</p>
            <h2 style={serif} className="mt-2 text-2xl font-medium xs:text-3xl sm:text-4xl">
              {mine.data.slot.startTime}–{mine.data.slot.endTime}
            </h2>
            <p className="mt-1 text-sm opacity-70">{mine.data.slot.label}</p>
            <Companions slotId={mine.data.slot.id} className="justify-center opacity-70" />

            <div className="mt-5 flex flex-col items-stretch gap-2 xs:flex-row xs:flex-wrap xs:items-center xs:justify-center">
              {mine.data.telegramLink && (
                <a
                  href={mine.data.telegramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#26A5E4] px-4 text-sm font-bold text-white transition-colors hover:bg-[#1E8FC7] xs:w-auto"
                >
                  <Send size={16} aria-hidden="true" />
                  Join the Telegram channel
                </a>
              )}
              {mine.data.slot.whatsappLink && (
                <a
                  href={mine.data.slot.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-bold text-white transition-colors hover:bg-[#1FBD59] xs:w-auto"
                >
                  <MessageCircle size={16} aria-hidden="true" />
                  Join your Prayer Watchmen Family
                </a>
              )}
              <a
                href={myPrayerWatchIcsHref(mine.data.signup.id)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-current px-4 text-sm font-semibold opacity-80 transition-colors hover:bg-white/10 hover:opacity-100 xs:w-auto"
              >
                <CalendarPlus size={16} aria-hidden="true" />
                Add to calendar
              </a>
            </div>

            {mine.data.pendingFamilyChangeRequest ? (
              <p className="mt-4 text-xs font-medium opacity-70">
                Request pending: move to {mine.data.pendingFamilyChangeRequest.toSlotTime} (
                {mine.data.pendingFamilyChangeRequest.toSlotLabel}) — awaiting admin review.
              </p>
            ) : (
              <div className="mt-4 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setRequestingChange((v) => !v);
                    setRequestSlotId("");
                    setRequestReason("");
                  }}
                  className="inline-flex min-h-11 items-center px-2 text-xs font-semibold underline opacity-70 transition-opacity hover:opacity-100"
                >
                  {requestingChange ? "Never mind" : "Request to change my Prayer Watchmen Family"}
                </button>
              </div>
            )}
          </div>

          {requestingChange && watch.data && (
            <div className="mt-4 space-y-3">
              <WatchHourPicker
                slots={watch.data.slots.filter((s) => s.id !== mine.data!.slot.id)}
                value={requestSlotId}
                onChange={setRequestSlotId}
                disabled={requestChange.isPending}
              />
              {requestSlotId && (
                <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
                  <label className="block text-xs font-medium text-gray-500 dark:text-white/45">Why are you changing? (optional)</label>
                  <textarea
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    placeholder="e.g. my work shift changed"
                    rows={2}
                    className={`${fieldCls} resize-none`}
                  />
                  <button
                    type="button"
                    onClick={handleRequestChange}
                    disabled={requestChange.isPending}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#87102C] px-4 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {requestChange.isPending && <Loader2 size={15} className="animate-spin" />}
                    Send request
                  </button>
                </div>
              )}
            </div>
          )}

          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-white/45">10 PM – 6 AM · pick your hour</p>
            {watch.data && <WatchHourPicker slots={watch.data.slots} value={slotId} onChange={setSlotId} />}
            <Companions slotId={slotId || null} />
          </div>

          {prefilled && hasMissingField && (
            <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
              <p className="text-xs text-gray-500 dark:text-white/45">
                A few details are missing from your profile — fill them in here, or{" "}
                <Link href="/dashboard/profile" className="font-semibold text-[#87102C] hover:underline dark:text-[#FFB3C1]">
                  update your profile
                </Link>{" "}
                first.
              </p>
              {needsName && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-white/45">Full name</label>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" className={fieldCls} />
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                {needsPhone && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-white/45">Phone number</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 801 234 5678" className={fieldCls} />
                  </div>
                )}
                {needsEmail && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-white/45">Email</label>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={fieldCls} />
                  </div>
                )}
              </div>
            </div>
          )}

          <label className="flex items-start gap-2.5">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#87102C] dark:accent-[#FFB3C1]"
            />
            <span className="text-xs leading-relaxed text-gray-600 dark:text-white/60">I agree to be committed to this prayer watch hour.</span>
          </label>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={submit.isPending}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#87102C] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#6E0C24] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submit.isPending && <Loader2 size={15} className="animate-spin" />}
            Confirm my watch
          </button>
        </form>
      )}

      {historyList.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-white/45">Watches you&apos;ve kept</h2>
          <div className="mt-3 space-y-3">
            {historyList.map((item) => (
              <PastWatchCard key={item.signupId} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
