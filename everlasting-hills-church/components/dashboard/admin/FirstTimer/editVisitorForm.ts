import { FRIEND_OR_FAMILY, HEARD_OTHER } from "@/lib/first-timer/fields";
import type { VisitorRow } from "./types";

export const inputClass =
  "w-full text-sm rounded-xl px-3.5 py-2.5 border border-[#E7CDD3]/60 dark:border-white/[0.10] bg-white dark:bg-white/[0.06] text-[#111] dark:text-white placeholder:text-[#a8a3a4] focus:outline-none focus:border-[#87102C] focus:ring-2 focus:ring-[#87102C]/15 transition-all";
export const labelClass = "block text-xs font-semibold text-[#5A4A4D] dark:text-white/60 mb-1.5";
export const selectClass = `${inputClass} text-left flex items-center justify-between`;

export type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  occupation: string;
  gender: string;
  attendanceType: string;
  membershipInterest: string;
  howDidYouLearn: string;
  invitedBy: string;
  heardFromOther: string;
  /** "true", "false" or "" when never answered. */
  isStudent: string;
};

export type SetField = <K extends keyof FormState>(key: K, value: FormState[K]) => void;

export function toForm(v: VisitorRow): FormState {
  return {
    firstName: v.firstName,
    lastName: v.lastName,
    email: v.email ?? "",
    phone: v.phone ?? "",
    address: "",
    occupation: v.occupation ?? "",
    gender: v.gender ?? "",
    attendanceType: v.attendanceType ?? "",
    membershipInterest: v.membershipInterest ?? "",
    howDidYouLearn: v.howDidYouLearn ?? "",
    invitedBy: v.invitedBy ?? "",
    heardFromOther: v.heardFromOther ?? "",
    isStudent: v.isStudent === true ? "true" : v.isStudent === false ? "false" : "",
  };
}

/**
 * What the save sends. The inviter goes only with Friend or Family and the
 * Other answer only with Other, the same rule the form and the API keep.
 */
export function toPayload(form: FormState) {
  const text = (s: string) => s.trim() || undefined;
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: text(form.email),
    phone: text(form.phone),
    address: text(form.address),
    occupation: text(form.occupation),
    gender: form.gender || undefined,
    attendanceType: form.attendanceType || undefined,
    membershipInterest: form.membershipInterest || undefined,
    howDidYouLearn: form.howDidYouLearn || undefined,
    invitedBy: form.howDidYouLearn === FRIEND_OR_FAMILY ? text(form.invitedBy) : undefined,
    heardFromOther: form.howDidYouLearn === HEARD_OTHER ? text(form.heardFromOther) : undefined,
    isStudent: form.isStudent === "" ? undefined : form.isStudent === "true",
  };
}

/** The saved values, as the row the list shows. */
export function toPatch(p: ReturnType<typeof toPayload>): Partial<VisitorRow> {
  return {
    firstName: p.firstName,
    lastName: p.lastName,
    email: p.email ?? null,
    phone: p.phone ?? null,
    occupation: p.occupation ?? null,
    gender: p.gender ?? null,
    attendanceType: p.attendanceType ?? null,
    membershipInterest: p.membershipInterest ?? null,
    howDidYouLearn: p.howDidYouLearn ?? null,
    isStudent: p.isStudent ?? null,
    ...(p.invitedBy !== undefined && { invitedBy: p.invitedBy }),
    ...(p.heardFromOther !== undefined && { heardFromOther: p.heardFromOther }),
  };
}
