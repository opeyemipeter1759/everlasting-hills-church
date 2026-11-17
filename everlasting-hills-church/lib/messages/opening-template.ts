import { z } from "zod";

/**
 * The opening message's rules, as the editor checks them while you type. The
 * API runs the same rules on save
 * (ehc-backend/src/message-templates/template-variables.ts and
 * message-template.schema.ts); keep the two in step.
 */
export const OPENING_KEY = "first_timer.opening";

export const TEMPLATE_VARIABLES = ["firstName", "churchName", "serviceTimes", "contactName", "contactPhone"] as const;
export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number];

/** What each placeholder becomes, in words for the editor. */
export const VARIABLE_HINT: Record<TemplateVariable, string> = {
  firstName: "Their first name",
  churchName: "The church's name",
  serviceTimes: "When services are",
  contactName: "Your first name",
  contactPhone: "Your phone number",
};

export const WHATSAPP_MAX = 1000;
export const EMAIL_SUBJECT_MAX = 200;
export const EMAIL_BODY_MAX = 5000;

/** The longest a person-specific value can be once filled in (longer ones are cut). */
const VARIABLE_MAX = { firstName: 30, contactName: 40, contactPhone: 20 };

const PLACEHOLDER = /\{\{\s*([^{}]*?)\s*\}\}/g;

/** Placeholders that cannot be filled in: unknown names, and braces left open. */
export function unknownPlaceholders(...texts: string[]): string[] {
  const unknown: string[] = [];
  const add = (name: string) => {
    if (!unknown.includes(name)) unknown.push(name);
  };
  for (const text of texts) {
    for (const match of Array.from(text.matchAll(PLACEHOLDER))) {
      if (!(TEMPLATE_VARIABLES as readonly string[]).includes(match[1])) add(match[1] || "(empty)");
    }
    const leftover = text.replace(PLACEHOLDER, "");
    if (leftover.includes("{{") || leftover.includes("}}")) add("unclosed braces");
  }
  return unknown;
}

/** The longest this WhatsApp text can be for anyone, with the church's own values as they are. */
export function longestWhatsApp(text: string, church: { churchName: string; serviceTimes: string }): number {
  const longest: Record<TemplateVariable, string> = {
    firstName: "x".repeat(VARIABLE_MAX.firstName),
    contactName: "x".repeat(VARIABLE_MAX.contactName),
    contactPhone: "x".repeat(VARIABLE_MAX.contactPhone),
    ...church,
  };
  return text.trim().replace(PLACEHOLDER, (whole, name: string) => longest[name as TemplateVariable] ?? whole).length;
}

export function describeUnknown(unknown: string[]): string {
  const named = unknown.map((n) => (n === "unclosed braces" ? "a placeholder with unclosed braces" : `{{${n}}}`)).join(", ");
  return `${named} cannot be filled in. Use only the placeholders listed.`;
}

/** One saved version, as the editor sends it. Every field is required: a save is a whole new version. */
export const saveTemplateSchema = z.object({
  whatsappBody: z.string().trim().min(1, "Write the WhatsApp message").max(2000),
  emailSubject: z.string().trim().min(1, "Write an email subject").max(EMAIL_SUBJECT_MAX),
  emailBody: z.string().trim().min(1, "Write the email").max(EMAIL_BODY_MAX),
});
export type TemplateDraft = z.infer<typeof saveTemplateSchema>;

/** Every problem with a draft, in plain words; empty when it can be saved. */
export function draftProblems(draft: TemplateDraft, church: { churchName: string; serviceTimes: string }): string[] {
  const parsed = saveTemplateSchema.safeParse(draft);
  const problems = parsed.success ? [] : parsed.error.issues.map((i) => i.message);
  const unknown = unknownPlaceholders(draft.whatsappBody, draft.emailSubject, draft.emailBody);
  if (unknown.length) problems.push(describeUnknown(unknown));
  const longest = longestWhatsApp(draft.whatsappBody, church);
  if (longest > WHATSAPP_MAX) problems.push(`The WhatsApp message can reach ${longest} characters once names are filled in. Keep it to ${WHATSAPP_MAX}.`);
  return problems;
}
