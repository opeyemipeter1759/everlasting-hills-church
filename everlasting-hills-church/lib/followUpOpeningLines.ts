// Small static lookup of suggested call openers for the "Log a contact" form.
// Pure frontend — no endpoint backs this, it's just a friendly nudge for a
// worker who's staring at a blank note field before dialing.

import type { FollowUpSourceType } from "@/types/follow-up";

/** `{name}` is replaced with the person's first name, `{you}` with the caller's
 * first name (or "the team" if unknown). */
const FIRST_TIMER_FIRST_CONTACT = [
  "Hi {name}, this is {you} from Everlasting Hills — so glad you joined us Sunday! I just wanted to check in and see how you're doing.",
  "Hello {name}! This is {you} calling from Everlasting Hills. We loved having you with us and wanted to say a proper hello.",
  "Hi {name}, it's {you} from Everlasting Hills. No agenda at all — just wanted to welcome you and see if you have any questions about the church.",
];

const FIRST_TIMER_FOLLOW_UP = [
  "Hi {name}, it's {you} again from Everlasting Hills — just checking in to see how you've been since we last spoke.",
  "Hello {name}, this is {you}. I wanted to follow up and see if there's anything we can help with as you settle in.",
  "Hi {name}, {you} here from Everlasting Hills — would love to hear how things are going for you.",
];

const ABSENTEE_FIRST_CONTACT = [
  "Hi {name}, this is {you} from Everlasting Hills — we've missed seeing you and wanted to check in. Is everything okay?",
  "Hello {name}, it's {you} calling from the church. We noticed you haven't been able to make it lately and just wanted to reach out.",
  "Hi {name}, {you} here from Everlasting Hills. You've been on our hearts — how have you been?",
];

const ABSENTEE_FOLLOW_UP = [
  "Hi {name}, it's {you} again — just following up to see how you're doing and whether we can support you in any way.",
  "Hello {name}, this is {you} from Everlasting Hills. Wanted to check back in since we last spoke.",
  "Hi {name}, {you} here — no pressure at all, just wanted to stay in touch and see how things are going.",
];

/** Returns 2-3 suggested opening lines for this entry, with `{name}`/`{you}`
 * already substituted. `callerFirstName` falls back to "the team" if unknown. */
export function getOpeningLines(opts: {
  sourceType: FollowUpSourceType;
  isFirstContact: boolean;
  personFirstName: string;
  callerFirstName?: string | null;
}): string[] {
  const { sourceType, isFirstContact } = opts;
  const templates =
    sourceType === "FIRST_TIMER"
      ? isFirstContact ? FIRST_TIMER_FIRST_CONTACT : FIRST_TIMER_FOLLOW_UP
      : isFirstContact ? ABSENTEE_FIRST_CONTACT : ABSENTEE_FOLLOW_UP;

  const you = opts.callerFirstName?.trim() || "the team";
  return templates.map((t) => t.replace(/\{name\}/g, opts.personFirstName).replace(/\{you\}/g, you));
}
