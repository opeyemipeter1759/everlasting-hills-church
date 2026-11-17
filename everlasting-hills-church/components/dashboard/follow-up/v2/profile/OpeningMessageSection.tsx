"use client";

import Link from "next/link";
import { useOpeningContext } from "@/lib/api/opening-message";
import { EmailSendButton } from "@/components/dashboard/first-timers/EmailSendButton";
import { SendsList, churchTime } from "@/components/dashboard/first-timers/SendsList";
import { WhatsAppSendButton } from "@/components/dashboard/first-timers/WhatsAppSendButton";
import type { ProfileSectionProps } from "./types";

/**
 * The opening message: send it on WhatsApp or by email, and every send so far.
 * The first-timer contact and admins see the buttons; the rest of the team
 * sees what was sent and when.
 */
export default function OpeningMessageSection({ profile, refresh }: ProfileSectionProps) {
  const { person } = profile;
  const query = useOpeningContext(person.visitorId);

  if (query.isLoading) return <div className="h-28 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/[0.05]" aria-label="Loading the opening message" />;
  const ctx = query.data;
  if (!ctx || (!ctx.canSend && ctx.sends.length === 0)) return null;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]" aria-label="Opening message">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-[#111] dark:text-white">Opening message</h2>
        <p className="text-xs text-gray-500 dark:text-white/45">
          {person.firstContactedAt ? `First contacted ${churchTime(person.firstContactedAt)}` : "Nobody has contacted them yet"}
        </p>
      </div>

      {ctx.canSend && !ctx.template && (
        <p className="mt-3 text-sm text-gray-600 dark:text-white/60">
          The opening message has not been written yet.{" "}
          <Link href="/dashboard/first-timers/messages" className="font-semibold text-[#87102C] underline-offset-2 hover:underline dark:text-[#FFB3C1]">
            Write it now
          </Link>
        </p>
      )}

      {ctx.canSend && ctx.template && (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            {ctx.whatsapp ? (
              <WhatsAppSendButton visitorId={person.visitorId} firstName={person.firstName} whatsapp={ctx.whatsapp} onLogged={refresh} />
            ) : (
              <p className="self-center text-sm text-gray-500 dark:text-white/50">No phone number to message.</p>
            )}
            {ctx.email && (
              <EmailSendButton visitorId={person.visitorId} firstName={person.firstName} to={ctx.email.to} emailsLeftToday={ctx.emailsLeftToday} onSent={refresh} />
            )}
          </div>
          {ctx.whatsapp && (
            <details className="mt-3 rounded-xl bg-gray-50 px-4 py-3 text-sm dark:bg-white/[0.03]">
              <summary className="cursor-pointer font-medium text-gray-700 dark:text-white/70">What the WhatsApp message says</summary>
              <p className="mt-2 whitespace-pre-line text-gray-700 dark:text-white/75">{ctx.whatsapp.text}</p>
            </details>
          )}
        </>
      )}

      <h3 className="mt-4 text-xs font-semibold text-gray-500 dark:text-white/45">Sent so far</h3>
      <div className="mt-1">
        <SendsList sends={ctx.sends} />
      </div>
    </section>
  );
}
