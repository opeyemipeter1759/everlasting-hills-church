"use client";

import { useMyFollowUpActivity } from "@/lib/api/my-follow-up";
import { Figures } from "./Figures";
import { myWords, rollWords } from "./summary-words";

/**
 * The header's lines for a member of the team: only the people assigned to
 * them, never the team's figures, which are for whoever runs the unit.
 */
export function MemberRoll() {
  const { data, isLoading } = useMyFollowUpActivity();
  if (isLoading) return <span className="inline-block h-4 w-56 animate-pulse rounded bg-white/20 align-middle" />;
  if (!data) return null;
  const c = data.assigned.counts;
  return (
    <>
      <Figures
        words={rollWords(
          { followingUp: c.FIRST_TIMER + c.SECOND_TIMER + c.THIRD_TIMER, firstTimers: c.FIRST_TIMER, secondTimers: c.SECOND_TIMER, thirdTimers: c.THIRD_TIMER },
          "you",
        )}
      />
      {data.assigned.active > 0 && (
        <span className="mt-1 block">
          <Figures words={myWords({ waitingFirstContact: data.waitingFirstContact, contactsThisMonth: data.contacts.thisMonth })} />
        </span>
      )}
    </>
  );
}
