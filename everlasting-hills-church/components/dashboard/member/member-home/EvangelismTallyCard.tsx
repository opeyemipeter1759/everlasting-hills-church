"use client";

import { Megaphone } from "lucide-react";
import { useMyEvangelismTally } from "@/lib/api/evangelism";
import { card, cardTitle, hdrBdr, iconBg, iconCl, kicker, muted } from "./tokens";

const people = (n: number) => `${n} ${n === 1 ? "person" : "people"}`;

/**
 * The member's own evangelism record: everyone recorded on the outreach form
 * with them as the worker who preached. Shown only once there is something to
 * show, so members who have not preached see nothing extra.
 */
export function EvangelismTallyCard() {
  const { data } = useMyEvangelismTally();
  if (!data || data.reached === 0) return null;

  return (
    <section className={`${card} overflow-hidden`} aria-label="Your evangelism">
      <div className={`flex items-center gap-3 px-5 py-4 ${hdrBdr}`}>
        <span className={iconBg}>
          <Megaphone size={15} className={iconCl} aria-hidden="true" />
        </span>
        <div>
          <p className={kicker}>Evangelism</p>
          <h3 className={cardTitle}>Your evangelism</h3>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 px-5 py-5">
        <div>
          <p className="text-3xl font-bold tabular-nums text-[#87102C] dark:text-[#FFB3C1]">{data.reached}</p>
          <p className={`text-sm ${muted}`}>{data.reached === 1 ? "person reached" : "people reached"}</p>
        </div>
        <div>
          <p className="text-3xl font-bold tabular-nums text-[#87102C] dark:text-[#FFB3C1]">{data.saved}</p>
          <p className={`text-sm ${muted}`}>gave their life to Christ</p>
        </div>
        {data.rededicated > 0 && (
          <p className={`col-span-2 text-sm ${muted}`}>
            {people(data.rededicated)} rededicated their life to Christ
          </p>
        )}
        <p className={`col-span-2 text-xs ${muted}`}>
          This year: {people(data.thisYear.reached)} reached · {data.thisYear.saved} saved
        </p>
      </div>
    </section>
  );
}
