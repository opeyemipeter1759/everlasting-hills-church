import type { FormValues } from "./_steps";

export interface FieldProblem {
  field: keyof FormValues;
  message: string;
}

/** Friendlier wording for the answers the server turns down most often. */
const DUPLICATE: Partial<Record<keyof FormValues, string>> = {
  email: "This email has already been used to register. Please use a different email address.",
  phone_number: "This phone number has already been used to register. Please use a different number.",
};

/** Words in a message that point at a field, for messages that don't use the field's own name. */
const HINTS: [RegExp, keyof FormValues][] = [
  [/\be-?mail\b/i, "email"],
  [/\bphone\b/i, "phone_number"],
];

function fieldIn(text: string, fields: (keyof FormValues)[]): keyof FormValues | null {
  // Validation messages start with the field's own name: "birth_day must be…".
  const named = fields.find((f) => new RegExp(`(^|[^a-z_])${f}([^a-z_]|$)`, "i").test(text));
  if (named) return named;
  return HINTS.find(([pattern]) => pattern.test(text))?.[1] ?? null;
}

/**
 * Which answers the server turned down, read from its error: the message, and
 * for validation failures, the list of messages in `details`. Unrecognised
 * errors give no fields — the form then just shows the message.
 */
export function problemsFromError(err: unknown, fields: (keyof FormValues)[]): FieldProblem[] {
  const e = (err ?? {}) as { message?: unknown; details?: unknown };
  const texts = [
    ...(Array.isArray(e.details) ? e.details.filter((d): d is string => typeof d === "string") : []),
    ...(typeof e.message === "string" ? [e.message] : []),
  ];
  const problems = new Map<keyof FormValues, string>();
  for (const text of texts) {
    const field = fieldIn(text, fields);
    if (!field || problems.has(field)) continue;
    problems.set(field, /already (exists|registered|been used)/i.test(text) ? (DUPLICATE[field] ?? text) : text);
  }
  return Array.from(problems, ([field, message]) => ({ field, message }));
}

/** The earliest step holding any of these fields, or null when none of them is on a step. */
export function firstStepWith(problems: FieldProblem[], stepFields: (keyof FormValues)[][]): number | null {
  const steps = problems
    .map((p) => stepFields.findIndex((fields) => fields.includes(p.field)))
    .filter((i) => i >= 0);
  return steps.length ? Math.min(...steps) : null;
}
