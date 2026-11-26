"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useFirstTimerProfile, useRefreshFollowUp } from "@/lib/api/first-timer-profile";
import { StatusChip } from "../StatusChip";
import { PersonAvatar, PhoneCell, stageText } from "../PersonCells";
import { shortDate } from "../status";
import AnswersSection from "./AnswersSection";
import ApprovalSection from "./ApprovalSection";
import FollowUpSection from "./FollowUpSection";
import OpeningMessageSection from "./OpeningMessageSection";
import PhotoSection from "./PhotoSection";
import VisitsSection from "./VisitsSection";
import { StickyName } from "./StickyName";

/**
 * A first-timer's full profile: who they are, where they stand, and every
 * action on them. Each section belongs to one part of the follow-up flow.
 */
export default function FirstTimerProfile() {
  const { visitorId } = useParams<{ visitorId: string }>();
  const query = useFirstTimerProfile(visitorId);
  const refresh = useRefreshFollowUp();
  const router = useRouter();
  // Back to wherever they opened this from (the Master list, a month, approvals);
  // a profile opened fresh, from an email link say, has nowhere to go back to.
  const back = () => (window.history.length > 1 ? router.back() : router.push("/dashboard/follow-up/overview"));

  if (query.isLoading) return <div className="mx-auto h-80 max-w-3xl animate-pulse rounded-2xl bg-gray-100 dark:bg-white/[0.05]" aria-label="Loading" />;
  if (!query.data) {
    return (
      <p className="mx-auto max-w-3xl rounded-2xl border border-dashed border-gray-300 px-5 py-10 text-center text-sm text-gray-500 dark:border-white/15 dark:text-white/50">
        This first-timer could not be found. They may have been archived.
      </p>
    );
  }

  const { person } = query.data;
  const props = { profile: query.data, refresh };

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-5 sm:px-0">
      <button type="button" onClick={back} className="inline-flex min-h-9 items-center gap-1 text-sm font-medium text-gray-500 hover:text-[#111] dark:text-white/55 dark:hover:text-white">
        <ArrowLeft size={15} aria-hidden="true" /> Back
      </button>
      <StickyName name={`${person.firstName} ${person.lastName}`} />
      <header className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <PersonAvatar row={person} size={64} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip status={person.status} />
            <span className="text-sm text-gray-600 dark:text-white/60">{stageText(person)}</span>
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-white/60">
            First visit {shortDate(person.firstVisitDate)}, {person.visits} {person.visits === 1 ? "visit" : "visits"} in all
          </p>
          <div className="mt-2 text-sm text-gray-700 dark:text-white/75">
            <PhoneCell phone={person.phone} />
          </div>
        </div>
      </header>
      <OpeningMessageSection {...props} />
      <ApprovalSection {...props} />
      <FollowUpSection {...props} />
      <VisitsSection {...props} />
      <PhotoSection {...props} />
      <AnswersSection {...props} />
    </div>
  );
}
