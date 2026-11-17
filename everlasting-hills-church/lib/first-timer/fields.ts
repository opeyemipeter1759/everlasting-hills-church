/**
 * The first-timer form's questions, in the order the form asks them, with the
 * labels it shows. The public form takes its labels and options from here, and
 * every page that shows a first-timer's answers renders them from here, so a
 * new question appears in both places with no extra work.
 *
 * `key` is the field's name on the API's first-timer record. `pastoral` fields
 * (a prayer request, faith and the service experience) stay on the person's own
 * profile: the API never sends them to lists, the Overview or any export.
 */
export interface FirstTimerField {
  key: string;
  label: string;
  pastoral?: boolean;
  /** Stored value to the label the form shows, for choice questions. */
  options?: { value: string; label: string; description?: string }[];
}

export const HOW_DID_YOU_LEARN_OPTIONS = [
  { value: "Social Media", label: "Social Media", description: "Instagram, Facebook, Twitter…" },
  { value: "Friend/Family", label: "Friend or Family", description: "Someone personally invited me" },
  { value: "Google Search", label: "Google Search", description: "Found us online" },
  { value: "Website", label: "Church Website", description: "Visited everlastinghills.org" },
  { value: "Flyer", label: "Flyer / Poster", description: "Physical or digital flyer" },
  { value: "Other", label: "Other", description: "Another way" },
];

/** Choosing this needs the inviter's name. */
export const FRIEND_OR_FAMILY = "Friend/Family";
/** Choosing this needs a few words on how. */
export const HEARD_OTHER = "Other";

export const FIRST_TIMER_FIELDS: FirstTimerField[] = [
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
  { key: "phone", label: "Phone Number" },
  { key: "email", label: "Email Address" },
  { key: "attendanceType", label: "How are you joining us today?", options: [{ value: "In-Person", label: "In-Person" }, { value: "Online", label: "Online / Livestream" }] },
  { key: "gender", label: "Gender" },
  { key: "howDidYouLearn", label: "How did you learn about us?", options: HOW_DID_YOU_LEARN_OPTIONS },
  { key: "invitedBy", label: "Who invited you?" },
  { key: "heardFromOther", label: "How did you hear about us?" },
  { key: "locatedInIbadan", label: "Do you reside in Ibadan?", options: [{ value: "true", label: "Yes" }, { value: "false", label: "No, visiting" }] },
  { key: "membershipInterest", label: "Would you like to attend another service with us?", options: [{ value: "Yes", label: "Yes!" }, { value: "Maybe", label: "Maybe" }, { value: "No", label: "Not for now" }] },
  { key: "address", label: "Home Address" },
  { key: "dateOfBirth", label: "Date of Birth" },
  { key: "isStudent", label: "Are you a student?", options: [{ value: "true", label: "Yes" }, { value: "false", label: "No" }] },
  { key: "occupation", label: "What do you do?" },
  { key: "bornAgain", label: "Are you born again?", pastoral: true },
  { key: "serviceExperience", label: "How was today's service for you?", pastoral: true },
  { key: "prayerPoint", label: "Prayer Request", pastoral: true },
  { key: "whatsappInterest", label: "Would you like to join our WhatsApp community?", options: [{ value: "true", label: "Yes" }, { value: "false", label: "No" }] },
  { key: "shareForConnections", label: "Can we introduce you to someone with things in common?", options: [{ value: "true", label: "Yes" }, { value: "false", label: "No" }] },
];

export const fieldLabel = (key: string) => FIRST_TIMER_FIELDS.find((f) => f.key === key)?.label ?? key;

/** An answer as the form would word it: the option's label when there is one. */
export function answerText(field: FirstTimerField, value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  const raw = String(value);
  return field.options?.find((o) => o.value === raw)?.label ?? raw;
}
