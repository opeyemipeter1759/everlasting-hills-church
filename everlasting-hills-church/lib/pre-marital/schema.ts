import { z } from "zod";

/**
 * The pre-marital counselling application. The API checks the same rules
 * (ehc-backend/src/pre-marital/pre-marital.schema.ts); keep the two in step.
 * Only what the pastors need to review it and reach the couple is asked.
 */

export const RELATIONSHIP_OPTIONS = [
  { value: "UNDER_6_MONTHS", label: "Less than 6 months" },
  { value: "6_TO_12_MONTHS", label: "6 to 12 months" },
  { value: "1_TO_2_YEARS", label: "1 to 2 years" },
  { value: "OVER_2_YEARS", label: "More than 2 years" },
] as const;

export const STATUS_OPTIONS = [
  { value: "NEW", label: "New" },
  { value: "IN_REVIEW", label: "In review" },
  { value: "CLOSED", label: "Closed" },
] as const;

export type ApplicationStatus = (typeof STATUS_OPTIONS)[number]["value"];

export const relationshipLabel = (v: string | null) => RELATIONSHIP_OPTIONS.find((o) => o.value === v)?.label ?? null;
export const statusLabel = (v: ApplicationStatus) => STATUS_OPTIONS.find((o) => o.value === v)?.label ?? v;

export type Who = "groom" | "bride";

export interface PreMaritalFormValues {
  groomFirstName: string;
  groomLastName: string;
  groomPhone: string;
  groomEmail: string;
  groomIsMember: "" | "YES" | "NO";
  brideFirstName: string;
  brideLastName: string;
  bridePhone: string;
  brideEmail: string;
  brideIsMember: "" | "YES" | "NO";
  weddingDate: string;
  relationshipLength: string;
  message: string;
  consent: boolean;
}

export const FORM_DEFAULTS: PreMaritalFormValues = {
  groomFirstName: "", groomLastName: "", groomPhone: "", groomEmail: "", groomIsMember: "",
  brideFirstName: "", brideLastName: "", bridePhone: "", brideEmail: "", brideIsMember: "",
  weddingDate: "", relationshipLength: "", message: "", consent: false,
};

/** Today in Lagos, YYYY-MM-DD. */
export function lagosToday(now = new Date()): string {
  return new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 10);
}

const name = (what: string) => z.string().trim().min(1, `Enter the ${what}`).max(60, "Keep the name under 60 characters");
const phone = (whose: string) =>
  z
    .string()
    .trim()
    .min(1, `Enter the ${whose} phone number`)
    .max(30, "That phone number is too long")
    .regex(/^[\d\s\-+()]+$/, "Use digits, spaces, + or brackets only")
    .refine((v) => v.replace(/\D/g, "").length >= 7, "That phone number is too short");
const email = (whose: string) =>
  z.string().trim().min(1, `Enter the ${whose} email address`).max(254, "That email address is too long").email("Enter a valid email address");
const member = (who: Who) => z.enum(["YES", "NO"], { error: `Say whether the ${who} is a member of Everlasting Hills` });

export const formSchema = z.object({
  groomFirstName: name("groom's first name"),
  groomLastName: name("groom's last name"),
  groomPhone: phone("groom's"),
  groomEmail: email("groom's"),
  groomIsMember: member("groom"),
  brideFirstName: name("bride's first name"),
  brideLastName: name("bride's last name"),
  bridePhone: phone("bride's"),
  brideEmail: email("bride's"),
  brideIsMember: member("bride"),
  weddingDate: z.string().refine((d) => !d || d >= lagosToday(), "The wedding date cannot be in the past"),
  relationshipLength: z.string(),
  message: z.string().trim().max(1000, "Keep this under 1,000 characters"),
  consent: z.literal(true, { error: "Both of you need to agree to apply" }),
});

export type FieldProblems = Partial<Record<keyof PreMaritalFormValues, string>>;

/** The first problem with each field, or none. */
export function problemsOf(values: PreMaritalFormValues): FieldProblems {
  const r = formSchema.safeParse(values);
  if (r.success) return {};
  const out: FieldProblems = {};
  for (const issue of r.error.issues) {
    const field = issue.path[0] as keyof PreMaritalFormValues;
    if (field && !out[field]) out[field] = issue.message;
  }
  return out;
}

/** What the API takes: trimmed, yes/no as booleans, blanks left out. */
export function toPayload(v: PreMaritalFormValues, submissionKey: string) {
  return {
    submissionKey,
    groomFirstName: v.groomFirstName.trim(),
    groomLastName: v.groomLastName.trim(),
    groomPhone: v.groomPhone.trim(),
    groomEmail: v.groomEmail.trim(),
    groomIsMember: v.groomIsMember === "YES",
    brideFirstName: v.brideFirstName.trim(),
    brideLastName: v.brideLastName.trim(),
    bridePhone: v.bridePhone.trim(),
    brideEmail: v.brideEmail.trim(),
    brideIsMember: v.brideIsMember === "YES",
    weddingDate: v.weddingDate || null,
    relationshipLength: v.relationshipLength || null,
    message: v.message.trim() || null,
    consent: v.consent,
  };
}
