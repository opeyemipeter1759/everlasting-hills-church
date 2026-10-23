"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { fraunces } from "@/lib/fonts/prayer-watch";
import { userMessageForError } from "@/lib/api/user-message";
import { usePublicPrayerWatch, useSubmitPrayerSignup, type PublicSlot } from "@/lib/api/prayer-watch";

const serif = { fontFamily: "var(--font-fraunces), serif" };

/** A custom dropdown in the page's own palette — the native <select> reads
 * coarse and OS-styled next to the rest of this page's refinement. */
function TimeSelect({ slots, value, onChange }: { slots: PublicSlot[]; value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = slots.find((s) => s.id === value);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm outline-none transition-colors focus:border-[#C9A24A]/60 focus:ring-1 focus:ring-[#C9A24A]/30"
      >
        <span className={selected ? "text-white" : "text-white/35"}>
          {selected ? `${selected.startTime}–${selected.endTime}` : "Select a time"}
        </span>
        <ChevronDown size={15} className={`shrink-0 text-white/40 transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <ul role="listbox" className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-white/10 bg-[#141414] shadow-xl shadow-black/40">
          {slots.map((s) => {
            const full = s.spotsLeft <= 0;
            const isSelected = s.id === value;
            return (
              <li key={s.id} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  disabled={full}
                  onClick={() => {
                    onChange(s.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                    full
                      ? "cursor-not-allowed text-white/25"
                      : isSelected
                        ? "bg-[#C9A24A]/10 text-[#C9A24A]"
                        : "text-white/80 hover:bg-white/[0.05]"
                  }`}
                >
                  <span style={serif} className="tabular-nums">{s.startTime}–{s.endTime}</span>
                  {full && <span className="text-xs">Full</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** The same cosmic burgundy glow every dark hero on this site uses — what
 * makes this page read as part of the church's site, not a separate app. */
function NightGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
      <div className="absolute right-[-10%] top-[-20%] h-[60%] w-[60%] rounded-full bg-[#87102C]/15 blur-[140px]" />
      <div className="absolute bottom-[-30%] left-[-10%] h-[50%] w-[50%] rounded-full bg-[#87102C]/10 blur-[120px]" />
    </div>
  );
}

/** A small ring that fills as the slot fills — the night-watch "moon" motif,
 * standing in for the literal "spots left" count. */
function OccupancyRing({ filled, full }: { filled: number; full: boolean }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" className="-rotate-90" aria-hidden="true">
      <circle cx="19" cy="19" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
      <circle
        cx="19"
        cy="19"
        r={r}
        fill="none"
        stroke={full ? "#8A6A3C" : "#C9A24A"}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - filled)}
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

/** The night timeline — a vertical line of watch-hours, not a row of cards. */
function NightTimeline({ slots }: { slots: PublicSlot[] }) {
  return (
    <div className="relative">
      <div className="absolute bottom-5 left-[19px] top-5 w-px bg-gradient-to-b from-[#C9A24A]/50 via-[#C9A24A]/20 to-[#C9A24A]/50" aria-hidden="true" />
      <div className="space-y-7">
        {slots.map((s) => {
          const full = s.spotsLeft <= 0;
          const filled = Math.min(1, Math.max(0, (s.capacity - s.spotsLeft) / s.capacity));
          return (
            <div key={s.id} className="relative flex items-center gap-5">
              <div className="relative z-10 shrink-0 rounded-full bg-church-dark">
                <OccupancyRing filled={filled} full={full} />
              </div>
              <div>
                <p style={serif} className="text-xl font-medium tabular-nums text-white sm:text-2xl">
                  {s.startTime}
                  <span className="mx-1 text-white/40">–</span>
                  {s.endTime}
                </p>
                <p className="mt-0.5 text-xs font-medium text-white/50">
                  {s.label}
                  {full && <span className="text-[#C9A24A]/70"> · Full</span>}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PrayerWatchSignup() {
  const watch = usePublicPrayerWatch();
  const submit = useSubmitPrayerSignup();

  const [slotId, setSlotId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isWorker, setIsWorker] = useState<boolean | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [confirmed, setConfirmed] = useState<{ slot: PublicSlot } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedSlot = watch.data?.slots.find((s) => s.id === slotId) ?? null;
  const inputCls =
    "pw-input w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-[#C9A24A]/60 focus:ring-1 focus:ring-[#C9A24A]/30";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!slotId) return setError("Choose a prayer watch hour.");
    if (!fullName.trim()) return setError("Your name is required.");
    if (!phone.trim()) return setError("Your phone number is required.");
    if (!email.trim()) return setError("Your email is required.");
    if (isWorker === null) return setError("Let us know if you're a worker or a member.");
    if (!agreed) return setError("Please confirm you'll be committed to this prayer watch hour.");

    try {
      await submit.mutateAsync({ slotId, fullName: fullName.trim(), phone: phone.trim(), email: email.trim(), isWorker });
      if (selectedSlot) setConfirmed({ slot: selectedSlot });
      watch.refetch();
    } catch (err) {
      setError(userMessageForError(err, "Couldn't complete your sign-up. Please try again."));
      watch.refetch();
    }
  }

  if (confirmed) {
    return (
      <main className={`${fraunces.variable} relative flex min-h-screen items-center justify-center overflow-hidden bg-church-dark px-5 py-36 text-white`}>
        <NightGlow />
        <div className="animate-fade-in relative z-10 max-w-md rounded-2xl border border-[#C9A24A]/30 bg-[#C9A24A]/[0.06] p-8 text-center sm:p-12">
          <p className="text-xs font-semibold tracking-wide text-[#C9A24A]">You&apos;re on the watch</p>
          <h1 style={serif} className="mt-3 text-3xl font-medium text-white sm:text-4xl">
            {confirmed.slot.startTime}–{confirmed.slot.endTime}
          </h1>
          <p className="mt-2 text-sm text-white/50">{confirmed.slot.label}</p>
          <p className="mx-auto mt-6 max-w-sm text-sm leading-relaxed text-white/70">
            Thank you, {fullName.trim().split(" ")[0]}. Come ready to seek His face — we&apos;ll be praying alongside you through the night.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={`${fraunces.variable} relative overflow-hidden bg-church-dark px-5 pb-16 pt-36 text-white sm:pb-24 sm:pt-44`}>
      <NightGlow />
      <div className="relative z-10 mx-auto max-w-5xl">
        <header className="mb-10 text-center sm:mb-12">
          <h1 style={serif} className="text-4xl font-medium text-white sm:text-6xl">
            {watch.data?.title ?? "Prayer Watch"}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/55">Kindly choose your prayer watch hour.</p>
          <p style={serif} className="mx-auto mt-7 max-w-lg text-base italic leading-relaxed text-white/75 sm:text-lg">
            &ldquo;My eyes are awake through the night watches, that I may meditate on Your word.&rdquo;
          </p>
          <p className="mt-2 text-xs font-medium text-[#C9A24A]">Psalm 119:148</p>
        </header>

        {watch.isLoading ? (
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16">
            <div className="space-y-7">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 w-48 animate-pulse rounded-lg bg-white/[0.04]" />
              ))}
            </div>
            <div className="h-96 animate-pulse rounded-2xl bg-white/[0.03]" />
          </div>
        ) : watch.isError ? (
          <p className="text-center text-sm text-rose-300">Could not load the watch schedule. Please refresh.</p>
        ) : (
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16">
            <div>
              <p className="mb-7 text-xs font-semibold tracking-wide text-[#C9A24A]">10 PM – 6 AM</p>
              {watch.data && <NightTimeline slots={watch.data.slots} />}
            </div>

            <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/55">Prayer watch hour</label>
                  <TimeSelect slots={watch.data?.slots ?? []} value={slotId} onChange={setSlotId} />
                </div>

                <div className="border-t border-white/[0.06] pt-4">
                  <label className="mb-1.5 block text-xs font-medium text-white/55">Full name</label>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" className={inputCls} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/55">Phone number</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 801 234 5678" className={inputCls} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/55">Email</label>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputCls} />
                  </div>
                </div>

                <div className="border-t border-white/[0.06] pt-4">
                  <label className="mb-1.5 block text-xs font-medium text-white/55">Are you a worker or a member?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { value: true, label: "Worker" },
                      { value: false, label: "Member" },
                    ] as const).map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setIsWorker(opt.value)}
                        aria-pressed={isWorker === opt.value}
                        className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                          isWorker === opt.value
                            ? "border-[#C9A24A] bg-[#C9A24A]/10 text-[#C9A24A]"
                            : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/25"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-start gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[#C9A24A]"
                  />
                  <span className="text-xs leading-relaxed text-white/60">I agree to be committed to this prayer watch hour.</span>
                </label>

                {error && <p className="text-sm text-rose-300">{error}</p>}

                <button
                  type="submit"
                  disabled={submit.isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C9A24A] px-6 py-3.5 text-sm font-semibold text-church-dark transition-colors hover:bg-[#D9B35E] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submit.isPending && <Loader2 size={15} className="animate-spin" />}
                  Confirm my watch
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
