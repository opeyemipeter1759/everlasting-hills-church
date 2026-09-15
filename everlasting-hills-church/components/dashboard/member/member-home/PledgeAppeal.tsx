"use client";

import { useCallback, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, HandCoins, Mic2, Pencil, Radio, Video } from "lucide-react";
import Drawer from "@/components/ui/overlay/Drawer";
import {
  SOUND_MEDIA,
  formatNaira,
  pledgePlan,
  useMyPledge,
  type Pledge,
} from "@/lib/api/pledges";
import PledgeForm, { PLEDGE_INTRO } from "./PledgeForm";

/**
 * The Sound & Media Project appeal, near the top of every member's home page.
 *
 * Before a member pledges it is deliberately loud: the church asked for it to
 * be impossible to miss. Once they have pledged it quietens into a thank-you
 * with their pledge and a way to update it.
 */

interface PledgeAppealProps {
  member: { firstName: string; lastName: string; email: string | null; phone: string | null } | null;
  userEmail?: string;
}

const longDate = (date: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${date}T12:00:00Z`),
  );

/** Sound levels, the project's own picture. Still when motion is reduced. */
function Levels() {
  const still = useReducedMotion();
  const bars = [0.45, 0.8, 0.6, 1, 0.7, 0.9, 0.5, 0.75, 0.95, 0.55, 0.85, 0.65];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-4 flex h-28 items-end gap-1.5 opacity-40 sm:right-8 sm:h-40 sm:gap-2">
      {bars.map((height, index) => (
        <motion.span
          key={index}
          className="block w-2 origin-bottom rounded-t-full bg-[#f2b84b] sm:w-3"
          style={{ height: `${height * 100}%` }}
          animate={still ? undefined : { scaleY: [height, 0.25, 1, 0.5, height] }}
          transition={still ? undefined : { duration: 1.8 + (index % 4) * 0.25, repeat: Infinity, ease: "easeInOut", delay: index * 0.07 }}
        />
      ))}
    </div>
  );
}

export function PledgeAppeal({ member, userEmail = "" }: PledgeAppealProps) {
  const { data: pledge, isLoading } = useMyPledge();
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<Pledge | null>(null);
  const close = useCallback(() => {
    setOpen(false);
    setSaved(null);
  }, []);

  if (isLoading) {
    return <div aria-hidden="true" className="h-56 animate-pulse rounded-3xl bg-[#87102C]/10 dark:bg-white/5" />;
  }

  const prefill = {
    fullName: member ? `${member.firstName} ${member.lastName}`.trim() : "",
    phone: member?.phone ?? "",
    email: member?.email ?? userEmail,
  };
  const firstName = (pledge?.fullName ?? prefill.fullName).split(/\s+/)[0];

  return (
    <>
      {pledge ? (
        <section
          aria-labelledby="pledge-thanks-title"
          className="rounded-3xl border border-[#f2b84b]/60 bg-gradient-to-br from-[#fff8e8] to-[#fff0f3] p-5 dark:border-[#f2b84b]/25 dark:from-[#2a1d0a] dark:to-[#2a0b14] sm:p-6"
        >
          <div className="flex flex-wrap items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#87102C] text-white">
              <CheckCircle2 size={24} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8a5a00] dark:text-[#f2c86b]">
                {SOUND_MEDIA.title}
              </p>
              <h2 id="pledge-thanks-title" className="mt-1 text-lg font-black text-gray-900 dark:text-white sm:text-xl">
                Thank you{firstName ? `, ${firstName}` : ""}. You pledged {formatNaira(pledge.amount)}.
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-white/65">
                {pledgePlan(pledge)} · to complete by {longDate(pledge.completeBy)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#87102C]/30 px-4 text-sm font-bold text-[#87102C] hover:bg-[#87102C]/5 dark:border-rose-300/30 dark:text-rose-200 dark:hover:bg-white/5 sm:w-auto"
            >
              <Pencil size={15} aria-hidden="true" />
              Update my pledge
            </button>
          </div>
        </section>
      ) : (
        <section
          aria-labelledby="pledge-appeal-title"
          className="relative isolate overflow-hidden rounded-3xl text-white shadow-xl shadow-[#87102C]/25 ring-1 ring-[#f2b84b]/40"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_85%_15%,rgba(242,184,75,0.4),transparent_45%),linear-gradient(135deg,#3f0615_0%,#87102C_55%,#b8182f_100%)]"
          />
          <Levels />
          <div className="relative p-5 sm:p-8">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#f2b84b] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#3a0612]">
              <HandCoins size={14} aria-hidden="true" />
              Sacrificial giving
            </p>
            <h2
              id="pledge-appeal-title"
              className="mt-3 max-w-2xl text-[1.75rem] font-black leading-[1.1] tracking-tight [text-wrap:balance] sm:text-5xl"
            >
              Pledge towards the {SOUND_MEDIA.title}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
              Help us strengthen our sound, media, recording, streaming and technical facilities for
              effective worship and ministry.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-white/90">
              {[
                { icon: Mic2, label: "Sound" },
                { icon: Video, label: "Media & recording" },
                { icon: Radio, label: "Streaming" },
              ].map(({ icon: Icon, label }) => (
                <li key={label} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/20">
                  <Icon size={13} aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="relative inline-flex w-full sm:w-auto">
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-2xl bg-[#f2b84b] opacity-50 motion-safe:animate-[ping_2.2s_cubic-bezier(0,0,0.2,1)_infinite]"
                />
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="relative inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#f2b84b] px-7 text-lg font-black text-[#3a0612] shadow-lg shadow-black/25 transition hover:bg-[#ffc85e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
                >
                  Make my pledge
                  <ArrowRight size={20} aria-hidden="true" />
                </button>
              </span>
              <span className="text-xs text-white/75">Takes about 2 minutes</span>
            </div>
          </div>
        </section>
      )}

      <Drawer open={open} onClose={close} maxWidth="xl">
        <div className="bg-gradient-to-br from-[#3f0615] to-[#87102C] px-5 pb-6 pt-6 text-white sm:px-7">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#f2b84b]">
            {SOUND_MEDIA.title}
          </p>
          <h2 className="mt-2 pr-10 text-2xl font-black tracking-tight">Financial Pledge Form</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/85">{PLEDGE_INTRO}</p>
        </div>
        {saved ? (
          <div role="status" className="space-y-4 p-6 text-center sm:p-8">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
              <CheckCircle2 size={34} aria-hidden="true" />
            </span>
            <h3 className="text-xl font-black text-gray-900 dark:text-white">Thank you for your pledge</h3>
            <p className="text-3xl font-black tabular-nums text-[#87102C] dark:text-rose-200">
              {formatNaira(saved.amount)}
            </p>
            <p className="text-sm text-gray-600 dark:text-white/65">
              {pledgePlan(saved)} · to complete by {longDate(saved.completeBy)}
            </p>
            <p className="text-sm text-gray-600 dark:text-white/65">
              We&apos;ve emailed a copy to {saved.email}. You can update your pledge from your home page at any time.
            </p>
            <button
              type="button"
              onClick={close}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#87102C] px-6 font-bold text-white hover:bg-[#6f0d24] sm:w-auto"
            >
              Done
            </button>
          </div>
        ) : (
          <PledgeForm existing={pledge ?? null} prefill={prefill} onSaved={setSaved} />
        )}
      </Drawer>
    </>
  );
}
