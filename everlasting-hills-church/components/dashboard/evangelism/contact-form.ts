import type { ContactInput, ContactRow, NextAction, SavedStatus } from "@/lib/api/evangelism";
import { displayPhone, todayLagos } from "./labels";

export const OTHER_WORKER = "__other__";

export interface ContactFormState {
  name: string;
  phone: string;
  address: string;
  savedStatus: SavedStatus | "";
  isStudent: "" | "yes" | "no";
  school: string;
  level: string;
  discussion: string;
  workerId: string;
  workerOther: string;
  outreachId: string;
  contactDate: string;
  nextAction: NextAction | "";
  consent: boolean;
}

export function emptyContactForm(overrides: Partial<ContactFormState> = {}): ContactFormState {
  return {
    name: "",
    phone: "",
    address: "",
    savedStatus: "",
    isStudent: "",
    school: "",
    level: "",
    discussion: "",
    workerId: "",
    workerOther: "",
    outreachId: "",
    contactDate: todayLagos(),
    nextAction: "",
    consent: false,
    ...overrides,
  };
}

export function formFromContact(c: ContactRow & { discussion?: string | null }): ContactFormState {
  return {
    name: c.name,
    phone: displayPhone(c.phone),
    address: c.address,
    savedStatus: c.savedStatus,
    isStudent: c.isStudent ? "yes" : "no",
    school: c.school ?? "",
    level: c.level ?? "",
    discussion: c.discussion ?? "",
    workerId: c.worker.id ?? OTHER_WORKER,
    workerOther: c.worker.id ? "" : c.worker.name,
    outreachId: c.outreach?.id ?? "",
    contactDate: new Date(new Date(c.contactDate).getTime() + 60 * 60 * 1000).toISOString().slice(0, 10),
    nextAction: c.nextAction ?? "",
    consent: c.consent,
  };
}

/** Same rule as the API: 080…, 070…, 090…, 081…, 091…, or with +234. */
export function isNigerianPhone(input: string): boolean {
  const digits = input.replace(/[\s\-().]/g, "").replace(/^\+/, "");
  let local: string;
  if (/^234\d{10}$/.test(digits)) local = digits.slice(3);
  else if (/^0\d{10}$/.test(digits)) local = digits.slice(1);
  else if (/^\d{10}$/.test(digits)) local = digits;
  else return false;
  return /^[789][01]\d{8}$/.test(local);
}

export type ContactFormErrors = Partial<Record<keyof ContactFormState, string>>;

export function validateContactForm(s: ContactFormState): ContactFormErrors {
  const e: ContactFormErrors = {};
  if (!s.name.trim()) e.name = "Enter their name";
  if (!s.phone.trim()) e.phone = "Enter their phone number";
  else if (!isNigerianPhone(s.phone)) e.phone = "Use a Nigerian number, like 0803 123 4567 or +234 803 123 4567";
  if (!s.address.trim()) e.address = "Enter their address";
  if (!s.savedStatus) e.savedStatus = "Choose one";
  if (!s.isStudent) e.isStudent = "Choose one";
  if (s.isStudent === "yes" && !s.school.trim()) e.school = "Enter the school name";
  if (!s.workerId) e.workerId = "Choose who preached to them";
  if (s.workerId === OTHER_WORKER && !s.workerOther.trim()) e.workerOther = "Type the worker's name";
  if (!s.contactDate) e.contactDate = "Choose the date";
  else if (s.contactDate > todayLagos()) e.contactDate = "The date can't be in the future";
  return e;
}

export function contactInput(s: ContactFormState): ContactInput {
  const student = s.isStudent === "yes";
  return {
    name: s.name.trim(),
    phone: s.phone.trim(),
    address: s.address.trim(),
    savedStatus: s.savedStatus as SavedStatus,
    isStudent: student,
    ...(student && s.school.trim() ? { school: s.school.trim() } : {}),
    ...(student && s.level.trim() ? { level: s.level.trim() } : {}),
    ...(s.discussion.trim() ? { discussion: s.discussion.trim() } : {}),
    ...(s.workerId === OTHER_WORKER ? { workerName: s.workerOther.trim() } : { workerMemberId: s.workerId }),
    ...(s.outreachId ? { outreachId: s.outreachId } : {}),
    contactDate: s.contactDate,
    ...(s.nextAction ? { nextAction: s.nextAction } : {}),
    consent: s.consent,
  };
}
