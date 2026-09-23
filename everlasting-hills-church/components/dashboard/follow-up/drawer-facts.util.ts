import type { FollowUpPerson } from "@/lib/api/follow-up-pipeline";

export interface Fact {
  label: string;
  value: string;
  href?: string;
}

/** A date as "3 September 2026", or the raw value if it will not parse. */
function day(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/** What is known about this person, in the order the drawer lists it. */
export function factsFor(person: FollowUpPerson): Fact[] {
  const facts: Fact[] = [];
  const add = (label: string, value: string | null | undefined, href?: string) => {
    if (value) facts.push({ label, value, href });
  };

  add("Phone", person.phone, person.phone ? `tel:${person.phone}` : undefined);
  add("Email", person.email, person.email ? `mailto:${person.email}` : undefined);
  add("Gender", person.gender);
  // Date of birth is collected as day + month only; the stored year is a
  // sentinel, so only the day and month are shown.
  add(
    "Birthday",
    person.dateOfBirth
      ? new Date(person.dateOfBirth).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" })
      : null,
  );
  add("Address", person.address);
  add("Work", person.occupation);
  add("Invited by", person.invitedBy);
  add("How they heard about us", person.howTheyHeard);
  add("Interested in membership", person.membershipInterest);
  add("Member since", day(person.memberSince));
  add(person.kind === "VISITOR" ? "First came" : "On the roll since", day(person.since));
  if (person.kind === "MEMBER") add("Services attended", String(person.attended));
  return facts;
}
