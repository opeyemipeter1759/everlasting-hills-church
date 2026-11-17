/**
 * The words a message template may fill in, and how a template is checked and
 * filled. Pure functions, no database: the editor's live checks, the save, the
 * preview and every send all go through these, so they can never disagree.
 *
 * The frontend mirrors the list and the checks in
 * everlasting-hills-church/lib/messages/opening-template.ts; keep the two in step.
 */

/** The opening message a first-timer gets after their first visit. */
export const OPENING_KEY = 'first_timer.opening';
export const TEMPLATE_KEYS = [OPENING_KEY] as const;
export type TemplateKey = (typeof TEMPLATE_KEYS)[number];

export const TEMPLATE_VARIABLES = ['firstName', 'churchName', 'serviceTimes', 'contactName', 'contactPhone'] as const;
export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number];
export type TemplateValues = Record<TemplateVariable, string>;

/**
 * A WhatsApp message travels inside the wa.me link, so it is kept short. The
 * cap applies to the message as sent, with every name filled in.
 */
export const WHATSAPP_MAX = 1000;
export const EMAIL_SUBJECT_MAX = 200;
export const EMAIL_BODY_MAX = 5000;

/**
 * The longest a person-specific value may be once filled in. Values are cut to
 * these lengths when a message is rendered, so the longest possible message is
 * known at save time and a save can promise the WhatsApp cap is never broken.
 */
export const VARIABLE_MAX: Record<'firstName' | 'contactName' | 'contactPhone', number> = {
  firstName: 30,
  contactName: 40,
  contactPhone: 20,
};

/** {{ name }}, spaces allowed inside the braces. */
const PLACEHOLDER = /\{\{\s*([^{}]*?)\s*\}\}/g;

/** Every placeholder name used, in order of first appearance. */
export function placeholdersIn(text: string): string[] {
  const found: string[] = [];
  for (const match of text.matchAll(PLACEHOLDER)) {
    if (!found.includes(match[1])) found.push(match[1]);
  }
  return found;
}

/**
 * The placeholders a template may not use: unknown names, and any braces left
 * open or closed on their own (a "{{firstName" would otherwise go out as typed).
 */
export function unknownPlaceholders(...texts: string[]): string[] {
  const unknown: string[] = [];
  const add = (name: string) => {
    if (!unknown.includes(name)) unknown.push(name);
  };
  for (const text of texts) {
    for (const name of placeholdersIn(text)) {
      if (!(TEMPLATE_VARIABLES as readonly string[]).includes(name)) add(name || '(empty)');
    }
    const leftover = text.replace(PLACEHOLDER, '');
    if (leftover.includes('{{') || leftover.includes('}}')) add('unclosed braces');
  }
  return unknown;
}

/** Cuts the person-specific values to their limits; the fixed church values pass through. */
export function clampValues(values: TemplateValues): TemplateValues {
  const cut = (s: string, max: number) => (s.length > max ? s.slice(0, max).trimEnd() : s);
  return {
    ...values,
    firstName: cut(values.firstName, VARIABLE_MAX.firstName),
    contactName: cut(values.contactName, VARIABLE_MAX.contactName),
    contactPhone: cut(values.contactPhone, VARIABLE_MAX.contactPhone),
  };
}

/** Fills every known placeholder. Values are clamped first; unknown ones are left as typed (a save never lets one in). */
export function renderTemplate(text: string, values: TemplateValues): string {
  const safe = clampValues(values);
  return text.replace(PLACEHOLDER, (whole, name: string) =>
    (TEMPLATE_VARIABLES as readonly string[]).includes(name) ? safe[name as TemplateVariable] : whole,
  );
}

/**
 * The longest this text can be once filled in for anyone: person-specific
 * values at their limits, the church's own values as they are.
 */
export function longestRenderedLength(text: string, church: Pick<TemplateValues, 'churchName' | 'serviceTimes'>): number {
  const longest: TemplateValues = {
    firstName: 'x'.repeat(VARIABLE_MAX.firstName),
    contactName: 'x'.repeat(VARIABLE_MAX.contactName),
    contactPhone: 'x'.repeat(VARIABLE_MAX.contactPhone),
    churchName: church.churchName,
    serviceTimes: church.serviceTimes,
  };
  return renderTemplate(text, longest).length;
}

/** Plain sentence for a 400: which placeholders are not allowed, and which are. */
export function unknownPlaceholderMessage(unknown: string[]): string {
  const named = unknown.map((n) => (n === 'unclosed braces' ? 'a placeholder with unclosed braces' : `{{${n}}}`)).join(', ');
  const allowed = TEMPLATE_VARIABLES.map((v) => `{{${v}}}`).join(', ');
  return `This template uses ${named}, which cannot be filled in. Use only ${allowed}.`;
}
