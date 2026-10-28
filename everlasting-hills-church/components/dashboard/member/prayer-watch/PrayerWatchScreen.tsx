"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarPlus, Loader2, MessageCircle, Users } from "lucide-react";
import { fraunces } from "@/lib/fonts/prayer-watch";
import { userMessageForError } from "@/lib/api/user-message";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import {
  myPrayerWatchIcsHref,
  useAddReflection,
  useCancelMySignup,
  useMoveMySignup,
  useMyPrayerHistory,
  useMyPrayerSignup,
  usePublicPrayerWatch,
  useSlotCompanions,
  useSubmitPrayerSignup,
  type PastWatch,
  type PublicSlot,
} from "@/lib/api/prayer-watch";
import { useMe } from "@/lib/api";

const serif = { fontFamily: "var(--font-fraunces), serif" };

const fieldCls =
  "min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#111] placeholder:text-gray-400 outline-none transition-colors focus:border-[#87102C]/50 focus:ring-1 focus:ring-[#87102C]/20 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/30 dark:focus:border-[#FFB3C1]/50 dark:focus:ring-[#FFB3C1]/20";

/** A ring that fills as a watch hour fills — stands in for a literal "spots left" count. */
function OccupancyRing({ filled, full }: { filled: number; full: boolean }) {
  const r = 14;
  const c = 2 * Math.PI * r;
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" className="-rotate-90 dark:hidden" aria-hidden="true">
      <circle cx="17" cy="17" r={r} fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
      <circle
        cx="17"
        cy="17"
        r={r}
        fill="none"
        stroke={full ? "#C9A3AC" : "#87102C"}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - filled)}
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

function OccupancyRingDark({ filled, full }: { filled: number; full: boolean }) {
  const r = 14;
  const c = 2 * Math.PI * r;
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" className="hidden -rotate-90 dark:block" aria-hidden="true">
      <circle cx="17" cy="17" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
      <circle
        cx="17"
        cy="17"
        r={r}
        fill="none"
        stroke={full ? "rgba(255,179,193,0.35)" : "#FFB3C1"}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - filled)}
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

/** The watch hours themselves are the picker — no separate dropdown duplicating the same choice. */
function WatchHourPicker({ slots, value, onChange, disabled }: { slots: PublicSlot[]; value: string; onChange: (id: string) => void; disabled?: boolean }) {
  return (
    <div role="radiogroup" aria-label="Prayer watch hour" className="space-y-2">
      {slots.map((s) => {
        const full = s.spotsLeft <= 0;
        const filled = Math.min(1, Math.max(0, (s.capacity - s.spotsLeft) / s.capacity));
        const selected = s.id === value;
        return (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={full || disabled}
            onClick={() => onChange(s.id)}
            className={`flex w-full items-center gap-4 rounded-xl border px-4 py-3 text-left transition-colors ${
              full
                ? "cursor-not-allowed border-gray-100 bg-gray-50 dark:border-white/5 dark:bg-white/[0.02]"
                : selected
                  ? "border-[#87102C] bg-[#FFF4F6] dark:border-[#FFB3C1] dark:bg-[#FFB3C1]/10"
                  : "border-gray-200 bg-white hover:border-[#87102C]/40 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-[#FFB3C1]/30"
            }`}
          >
            <span className="shrink-0">
              <OccupancyRing filled={filled} full={full} />
              <OccupancyRingDark filled={filled} full={full} />
            </span>
            <span className="min-w-0">
              <span style={serif} className={`block text-lg font-medium tabular-nums sm:text-xl ${full ? "text-gray-400 dark:text-white/30" : "text-[#111] dark:text-white"}`}>
                {s.startTime}
                <span className="mx-1 text-gray-400 dark:text-white/30">–</span>
                {s.endTime}
              </span>
              <span className="mt-0.5 block text-xs font-medium text-gray-500 dark:text-white/45">
                {s.label}
                {full && <span className="text-[#87102C]/70 dark:text-[#FFB3C1]/70"> · Full</span>}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** "N others are on this hour" — the shared-vigil nudge, never names beyond first names. */
function Companions({ slotId }: { slotId: string | null }) {
  const companions = useSlotCompanions(slotId);
  if (!slotId || companions.isLoading || !companions.data || companions.data.count === 0) return null;
  const { count, firstNames } = companions.data;
  const shown = firstNames.slice(0, 3).join(", ");
  const rest = count - Math.min(3, firstNames.length);
  return (
    <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 dark:text-white/45">
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
  const cancelMine = useCancelMySignup();
  const moveMine = useMoveMySignup();
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
  const [changingHour, setChangingHour] = useState(false);
  const [newSlotId, setNewSlotId] = useState("");
  const [cancelling, setCancelling] = useState(false);

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

  async function handleMove(toSlotId: string) {
    if (!mine.data) return;
    setError(null);
    try {
      await moveMine.mutateAsync({ id: mine.data.signup.id, slotId: toSlotId });
      setChangingHour(false);
    } catch (err) {
      setError(userMessageForError(err, "Couldn't move your sign-up. Please try again."));
    }
  }

  async function handleCancel() {
    if (!mine.data) return;
    try {
      await cancelMine.mutateAsync(mine.data.signup.id);
      setCancelling(false);
    } catch (err) {
      setError(userMessageForError(err, "Couldn't cancel your sign-up. Please try again."));
      setCancelling(false);
    }
  }

  const historyList = history.data ?? [];

  return (
    <div className={`${fraunces.variable} mx-auto max-w-2xl py-6 sm:py-8`}>
      <h1 style={serif} className="text-2xl font-medium text-[#111] dark:text-white xs:text-3xl sm:text-4xl">
        {watch.data?.title ?? "Prayer Watch"}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-white/60">
        Our thirty days of fasting are ending, and heaven did not stay silent — purification, boldness, an open door, a
        season of increase that will not be interrupted. This watch is how we hold that ground: choose an hour below,
        and keep it fully until every word spoken over this house is fulfilled.
      </p>

      <div className="mt-5 rounded-2xl border border-[#E7CDD3]/60 bg-[#FFF4F6]/50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <p style={serif} className="text-sm italic leading-relaxed text-[#6E0C24] dark:text-[#FFB3C1] sm:text-base">
          &ldquo;And give Him no rest until He establishes and confirms Jerusalem{" "}
          <span className="not-italic">[the city of security and peace]</span> and makes it a praise in the earth.&rdquo;
        </p>
        <p className="mt-2 text-xs font-medium text-[#87102C]/70 dark:text-[#FFB3C1]/70">Isaiah 62:7, Amplified</p>
      </div>

      {watch.isLoading || me.isLoading || mine.isLoading ? (
        <div className="mt-8 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
          ))}
        </div>
      ) : watch.isError ? (
        <p className="mt-8 text-sm text-red-600 dark:text-red-400">Could not load the watch schedule. Please refresh.</p>
      ) : mine.data ? (
        <div className="mt-8">
          <div className="rounded-2xl border border-[#87102C]/25 bg-[#FFF4F6] p-5 text-center xs:p-6 dark:border-[#FFB3C1]/25 dark:bg-[#FFB3C1]/10">
            <p className="text-xs font-semibold text-[#87102C] dark:text-[#FFB3C1]">You&apos;re on the watch</p>
            <h2 style={serif} className="mt-2 text-2xl font-medium text-[#111] dark:text-white xs:text-3xl sm:text-4xl">
              {mine.data.slot.startTime}–{mine.data.slot.endTime}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-white/45">{mine.data.slot.label}</p>
            <Companions slotId={mine.data.slot.id} />

            <div className="mt-5 flex flex-col items-stretch gap-2 xs:flex-row xs:flex-wrap xs:items-center xs:justify-center">
              {mine.data.slot.whatsappLink && (
                <a
                  href={mine.data.slot.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-bold text-white transition-colors hover:bg-[#1FBD59] xs:w-auto"
                >
                  <MessageCircle size={16} aria-hidden="true" />
                  Join WhatsApp group
                </a>
              )}
              <a
                href={myPrayerWatchIcsHref(mine.data.signup.id)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#87102C]/30 px-4 text-sm font-semibold text-[#87102C] transition-colors hover:bg-white dark:border-[#FFB3C1]/30 dark:text-[#FFB3C1] dark:hover:bg-white/5 xs:w-auto"
              >
                <CalendarPlus size={16} aria-hidden="true" />
                Add to calendar
              </a>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-2">
              <button
                type="button"
                onClick={() => {
                  setChangingHour((v) => !v);
                  setNewSlotId("");
                }}
                className="inline-flex min-h-11 items-center px-2 text-xs font-semibold text-gray-500 hover:text-[#87102C] dark:text-white/45 dark:hover:text-[#FFB3C1]"
              >
                {changingHour ? "Never mind" : "Change my hour"}
              </button>
              <button
                type="button"
                onClick={() => setCancelling(true)}
                className="inline-flex min-h-11 items-center px-2 text-xs font-semibold text-gray-500 hover:text-red-600 dark:text-white/45 dark:hover:text-red-400"
              >
                Cancel my sign-up
              </button>
            </div>
          </div>

          {changingHour && watch.data && (
            <div className="mt-4">
              <WatchHourPicker
                slots={watch.data.slots.filter((s) => s.id !== mine.data!.slot.id)}
                value={newSlotId}
                onChange={(id) => {
                  setNewSlotId(id);
                  handleMove(id);
                }}
                disabled={moveMine.isPending}
              />
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

      <ConfirmDialog
        open={cancelling}
        title="Cancel your sign-up?"
        description={mine.data ? `You'll give up your ${mine.data.slot.startTime}–${mine.data.slot.endTime} hour. You can sign up for another any time.` : ""}
        confirmLabel="Yes, cancel"
        tone="danger"
        loading={cancelMine.isPending}
        onConfirm={handleCancel}
        onCancel={() => setCancelling(false)}
      />
    </div>
  );
}
