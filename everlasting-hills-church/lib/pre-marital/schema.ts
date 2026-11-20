import { z } from "zod";

/**
 * Pre-marital counselling: the public form's rules (the API checks the same in
 * ehc-backend/src/premarital/premarital.schema.ts; keep them in step), and the
 * words the dashboard uses for statuses.
 */

export type CaseStatus =
  | "SUBMITTED" | "UNDER_REVIEW" | "ADDITIONAL_INFORMATION_REQUIRED" | "ACCEPTED_FOR_COUNSELLING"
  | "IN_COUNSELLING" | "FINAL_REVIEW" | "COMPLETED" | "CLOSED";

export const STATUS_LABEL: Record<CaseStatus, string> = {
  SUBMITTED: "New",
  UNDER_REVIEW: "Under review",
  ADDITIONAL_INFORMATION_REQUIRED: "Waiting for information",
  ACCEPTED_FOR_COUNSELLING: "Accepted",
  IN_COUNSELLING: "In counselling",
  FINAL_REVIEW: "Final review",
  COMPLETED: "Completed",
  CLOSED: "Closed",
};

export const MEMBERSHIP_OPTIONS = [
  { value: "BOTH_MEMBERS", label: "We are both members" },
  { value: "ONE_MEMBER", label: "One of us is a member" },
  { value: "NEITHER", label: "Neither of us is a member yet" },
] as const;

export const ROLE_OPTIONS = [
  { value: "GROOM", label: "Intending groom" },
  { value: "BRIDE", label: "Intending bride" },
] as const;
export type ApplicantRole = "GROOM" | "BRIDE";

export const CONTACT_OPTIONS = [
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "PHONE_CALL", label: "Phone call" },
  { value: "EMAIL", label: "Email" },
] as const;

export interface PremaritalFormValues {
  applicantRole: string;
  applicantFirstName: string;
  applicantLastName: string;
  applicantEmail: string;
  applicantPhone: string;
  partnerFirstName: string;
  partnerLastName: string;
  partnerEmail: string;
  partnerPhone: string;
  partnerConsentToContact: boolean;
  membership: string;
  weddingDate: string;
  preferredContact: string;
  intro: string;
  privacyAcknowledged: boolean;
  /** Honeypot: hidden from people. */
  website: string;
}

export const FORM_DEFAULTS: PremaritalFormValues = {
  applicantRole: "",
  applicantFirstName: "", applicantLastName: "", applicantEmail: "", applicantPhone: "",
  partnerFirstName: "", partnerLastName: "", partnerEmail: "", partnerPhone: "", partnerConsentToContact: false,
  membership: "", weddingDate: "", preferredContact: "", intro: "", privacyAcknowledged: false, website: "",
};

export function lagosToday(now = new Date()): string {
  return new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 10);
}

const name = (what: string) => z.string().trim().min(1, `Enter ${what}`).max(60, "Keep the name under 60 characters");
const phoneRules = (s: z.ZodString) =>
  s.max(30, "That phone number is too long").regex(/^[\d\s\-+()]+$/, "Use digits, spaces, + or brackets only")
    .refine((v) => v.replace(/\D/g, "").length >= 7, "That phone number is too short");
const emailRules = (s: z.ZodString) => s.max(254, "That email address is too long").email("Enter a valid email address");

export const formSchema = z
  .object({
    applicantRole: z.enum(["GROOM", "BRIDE"], { error: "Tell us whether you are the intending groom or the intending bride" }),
    applicantFirstName: name("your first name"),
    applicantLastName: name("your last name"),
    applicantEmail: emailRules(z.string().trim().min(1, "Enter your email address")),
    applicantPhone: phoneRules(z.string().trim().min(1, "Enter your phone number")),
    partnerFirstName: name("your partner's first name"),
    partnerLastName: name("your partner's last name"),
    partnerEmail: z.string().trim().refine((v) => !v || z.string().email().safeParse(v).success, "Enter a valid email address"),
    partnerPhone: z.string().trim().refine((v) => !v || phoneRules(z.string()).safeParse(v).success, "Check your partner's phone number"),
    partnerConsentToContact: z.literal(true, { error: "Confirm your partner is happy for us to contact them" }),
    membership: z.enum(["BOTH_MEMBERS", "ONE_MEMBER", "NEITHER"], { error: "Tell us whether you are members of Everlasting Hills" }),
    weddingDate: z.string().refine((d) => !d || d >= lagosToday(), "The wedding date cannot be in the past"),
    preferredContact: z.enum(["WHATSAPP", "PHONE_CALL", "EMAIL"], { error: "Choose how we should contact you" }),
    intro: z.string().trim().max(500, "Keep this under 500 characters"),
    privacyAcknowledged: z.literal(true, { error: "Please read and accept the privacy notice" }),
    website: z.string(),
  })
  .superRefine((v, ctx) => {
    if (!v.partnerEmail.trim() && !v.partnerPhone.trim()) {
      ctx.addIssue({ code: "custom", path: ["partnerPhone"], message: "Give a phone number or email address for your partner" });
    }
  });

export type FieldProblems = Partial<Record<keyof PremaritalFormValues, string>>;

/** The first problem with each answer. The partner-contact rule is checked even when other answers are missing. */
export function problemsOf(values: PremaritalFormValues): FieldProblems {
  const out: FieldProblems = {};
  const r = formSchema.safeParse(values);
  if (!r.success) {
    for (const issue of r.error.issues) {
      const field = issue.path[0] as keyof PremaritalFormValues;
      if (field && !out[field]) out[field] = issue.message;
    }
  }
  if (!values.partnerEmail.trim() && !values.partnerPhone.trim() && !out.partnerPhone) {
    out.partnerPhone = "Give a phone number or email address for your partner";
  }
  return out;
}

/** What the API takes: trimmed, blanks left out. */
export function toPayload(v: PremaritalFormValues, submissionKey: string) {
  const t = (s: string) => s.trim() || null;
  return {
    submissionKey,
    website: v.website,
    applicantRole: v.applicantRole,
    applicantFirstName: v.applicantFirstName.trim(),
    applicantLastName: v.applicantLastName.trim(),
    applicantEmail: v.applicantEmail.trim(),
    applicantPhone: v.applicantPhone.trim(),
    partnerFirstName: v.partnerFirstName.trim(),
    partnerLastName: v.partnerLastName.trim(),
    partnerEmail: t(v.partnerEmail),
    partnerPhone: t(v.partnerPhone),
    partnerConsentToContact: v.partnerConsentToContact,
    membership: v.membership,
    weddingDate: v.weddingDate || null,
    preferredContact: v.preferredContact,
    intro: t(v.intro),
    privacyAcknowledged: v.privacyAcknowledged,
  };
}
