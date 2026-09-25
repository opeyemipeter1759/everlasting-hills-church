import Link from "next/link";
import Image from "next/image";
import {
  AlertTriangle,
  ChevronRight,
  HandHeart,
  Heart,
  ListChecks,
  MessageCircleQuestion,
  MessageSquareQuote,
  Phone,
  type LucideIcon,
} from "lucide-react";
import DashboardCard, { type DashboardCardChrome } from "./DashboardCard";
import type { AdminDashboardData } from "@/lib/types/admin-dashboard";

/** How many at-risk people the card names before deferring to the full list. */
const NAMED_AT_RISK = 3;

type Care = AdminDashboardData["pastoralCare"];

/** A count row. `href` is omitted where no screen exists to send the admin to. */
function CountRow({
  icon: Icon,
  label,
  value,
  iconBg,
  iconColor,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  iconBg: string;
  iconColor: string;
  href?: string;
}) {
  const body = (
    <>
      <span className="flex min-w-0 items-center gap-3">
        <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon size={15} className={iconColor} aria-hidden="true" />
        </span>
        <span className="truncate text-sm font-medium text-[#444] dark:text-white/70">{label}</span>
      </span>
      <span className="flex flex-shrink-0 items-center gap-1">
        <span className="font-display text-lg font-bold tabular-nums text-[#111] dark:text-white">
          {value}
        </span>
        {href && (
          <ChevronRight
            size={15}
            className="text-[#b8a8ac] transition-transform group-hover:translate-x-0.5 dark:text-white/30"
            aria-hidden="true"
          />
        )}
      </span>
    </>
  );

  const shell =
    "group flex items-center justify-between gap-3 rounded-xl bg-[#FFF4F6]/50 px-4 py-3 dark:bg-white/[0.03]";

  if (!href) return <li className={shell}>{body}</li>;
  return (
    <li>
      <Link
        href={href}
        className={`${shell} w-full transition-colors hover:bg-[#FFE8ED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]/30 dark:hover:bg-white/[0.06]`}
      >
        {body}
      </Link>
    </li>
  );
}

function GroupLabel({ children }: { children: string }) {
  return (
    <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8a7e80] xs:tracking-[0.2em] dark:text-white/40">
      {children}
    </p>
  );
}

function Initials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-[11px] font-bold text-sky-700 dark:bg-sky-500/20 dark:text-sky-400">
      {initials || "?"}
    </span>
  );
}

/**
 * Shepherding at a glance, in the two halves the work actually divides into:
 * inboxes an administrator clears at a desk, and people somebody has to reach.
 * They are grouped rather than stacked as five equal rows because "answer a
 * question" and "call a member who has stopped coming" are not the same job.
 *
 * At-risk members are named rather than counted — /members/at-risk already
 * returns the name, photo and phone number, and a count alone left the admin
 * with nothing to act on; a tap-to-call sits on each row for that reason.
 */
export default function PastoralCareCard({
  care,
  ...chrome
}: { care: Care } & DashboardCardChrome) {
  const atRisk = care.atRisk ?? [];
  const named = atRisk.slice(0, NAMED_AT_RISK);
  const remaining = atRisk.length - named.length;

  const inboxCount = care.questions + care.testimonies + care.prayerRequests;
  const peopleCount = care.openFollowUps + care.atRiskMembers;
  const allClear = inboxCount === 0 && peopleCount === 0;

  return (
    <DashboardCard kicker="Shepherding" title="Pastoral Care" icon={HandHeart} {...chrome}>
      {allClear ? (
        <div className="flex flex-col items-center gap-1.5 py-8 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/15">
            <HandHeart size={18} className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-[#111] dark:text-white">Nothing outstanding</p>
          <p className="max-w-xs text-xs text-[#8a7e80] dark:text-white/40">
            Every inbox is clear and nobody is drifting.
          </p>
        </div>
      ) : (
        <>
          {inboxCount > 0 && (
            <div>
              <GroupLabel>Waiting on you</GroupLabel>
              <ul className="space-y-2.5">
                {care.questions > 0 && (
                  <CountRow
                    icon={MessageCircleQuestion}
                    label="Questions waiting for an answer"
                    value={care.questions}
                    iconBg="bg-amber-50 dark:bg-amber-500/15"
                    iconColor="text-amber-600 dark:text-amber-400"
                    href="/dashboard/questions"
                  />
                )}
                {care.testimonies > 0 && (
                  <CountRow
                    icon={MessageSquareQuote}
                    label="Testimonies to review"
                    value={care.testimonies}
                    iconBg="bg-sky-50 dark:bg-sky-500/15"
                    iconColor="text-sky-600 dark:text-sky-400"
                    href="/dashboard/testimonies"
                  />
                )}
                {care.prayerRequests > 0 && (
                  <CountRow
                    icon={Heart}
                    label="Prayer requests to pray over"
                    value={care.prayerRequests}
                    iconBg="bg-[#FFE8ED] dark:bg-[#87102C]/25"
                    iconColor="text-[#87102C] dark:text-[#FFB3C1]"
                    href="/dashboard/prayer-requests"
                  />
                )}
              </ul>
            </div>
          )}

          {peopleCount > 0 && (
            <div className={inboxCount > 0 ? "mt-4 border-t border-[#E7CDD3]/40 pt-4 dark:border-white/[0.07]" : ""}>
              <GroupLabel>People to reach</GroupLabel>
              <ul className="space-y-2.5">
                {care.openFollowUps > 0 && (
                  <CountRow
                    icon={ListChecks}
                    label="Open Follow-ups"
                    value={care.openFollowUps}
                    iconBg="bg-violet-50 dark:bg-violet-500/15"
                    iconColor="text-violet-600 dark:text-violet-400"
                    href="/dashboard/pastor/follow-ups"
                  />
                )}
                {care.atRiskMembers > 0 && (
                  <CountRow
                    icon={AlertTriangle}
                    label="At-Risk Members"
                    value={care.atRiskMembers}
                    iconBg="bg-sky-50 dark:bg-sky-500/15"
                    iconColor="text-sky-600 dark:text-sky-400"
                  />
                )}
              </ul>

              {named.length > 0 && (
                <ul className="mt-2.5 space-y-2">
                  {named.map((person) => (
                    <li
                      key={person.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-[#FFF4F6]/50 px-3 py-2.5 dark:bg-white/[0.03]"
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        {person.photoUrl ? (
                          <Image
                            src={person.photoUrl}
                            alt=""
                            width={32}
                            height={32}
                            className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <Initials name={person.name} />
                        )}
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-[#111] dark:text-white/85">
                            {person.name}
                          </span>
                          <span className="block truncate text-xs text-[#8a7e80] dark:text-white/40">
                            {person.reason}
                          </span>
                        </span>
                      </span>
                      {person.phone && (
                        <a
                          href={`tel:${person.phone}`}
                          aria-label={`Call ${person.name}`}
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-400 dark:hover:bg-emerald-500/25"
                        >
                          <Phone size={14} aria-hidden="true" />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {remaining > 0 && (
                <p className="mt-2.5 text-xs text-[#8a7e80] dark:text-white/40">
                  and {remaining} more drifting.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </DashboardCard>
  );
}
