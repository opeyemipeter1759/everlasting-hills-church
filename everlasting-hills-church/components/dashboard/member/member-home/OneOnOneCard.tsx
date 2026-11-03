"use client";

import Link from "next/link";
import { CalendarHeart } from "lucide-react";
import { useMyRequests } from "@/lib/api/one-on-one";
import { FORMAT_LABEL, formatWhenLong, isOpen, pastorsOf, StatusPill } from "@/components/dashboard/one-on-one/member/parts";
import { card, cardTitle, hdrBdr, iconBg, iconCl, kicker, linkCl, muted } from "./tokens";

/** The member's next one-on-one session, or an invitation to request one. */
export function OneOnOneCard() {
  const { data, isLoading, isError } = useMyRequests();
  if (isLoading || isError) return null;
  const open = (data ?? []).filter((r) => isOpen(r)).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const next = open[0];
  const more = open.length - 1;

  return (
    <section className={card} aria-label="One-on-One">
      <div className={`flex items-center gap-3 px-5 py-4 ${hdrBdr}`}>
        <span className={iconBg}>
          <CalendarHeart size={15} className={iconCl} aria-hidden="true" />
        </span>
        <div>
          <p className={kicker}>One-on-One</p>
          <h3 className={cardTitle}>{next ? "Your next session" : "Time with a pastor"}</h3>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 px-5 py-5">
        {next ? (
          <>
            <StatusPill request={next} />
            <p className="mt-1 text-xl font-bold tabular-nums text-[#111] dark:text-white">
              {formatWhenLong(next.proposedStartsAt ?? next.startsAt, next.proposedEndsAt ?? next.endsAt)}
            </p>
            <p className={`text-sm ${muted}`}>
              With {pastorsOf(next)} · {FORMAT_LABEL[next.format]}
            </p>
            {more > 0 && <p className={`text-xs ${muted}`}>and {more === 1 ? "1 more session" : `${more} more sessions`} coming up</p>}
            <Link href="/dashboard/one-on-one" className={`${linkCl} mt-2`}>
              {next.status === "PROPOSED" ? "Answer the suggested time →" : "View session →"}
            </Link>
          </>
        ) : (
          <>
            <p className={`text-sm ${muted}`}>Request a private session with Pastor Opeyemi or Pastor Faith to talk, pray and receive counsel.</p>
            <Link href="/dashboard/one-on-one" className={`${linkCl} mt-2`}>
              Book time →
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
