import type {
  ActionKind,
  ContactStatus,
  FollowUpFlag,
  NextAction,
  ReviewOutcome,
  SavedStatus,
  TaskPriority,
  TaskStatus,
  TaskType,
} from "@/lib/api/evangelism";

export const SAVED_LABEL: Record<SavedStatus, string> = {
  YES: "Saved",
  REDEDICATED: "Rededicated",
  NO: "Not yet",
  ALREADY: "Already saved",
};

/** The form asks it as a question. */
export const SAVED_QUESTION: { value: SavedStatus; label: string }[] = [
  { value: "YES", label: "Yes" },
  { value: "REDEDICATED", label: "Rededicated" },
  { value: "NO", label: "No" },
  { value: "ALREADY", label: "Already saved" },
];

export const SAVED_TONE: Record<SavedStatus, string> = {
  YES: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  REDEDICATED: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  NO: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60",
  ALREADY: "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
};

export const STATUS_LABEL: Record<ContactStatus, string> = {
  NEW: "New",
  CALL_DONE: "Follow-up call done",
  CALL_BACK: "Call back needed",
  NEEDS_VISIT: "Needs visitation",
  VISITED: "Visited",
  INVITED: "Invited to church",
  ATTENDED: "Attended church",
  JOINED: "Joined a unit / member",
  NOT_INTERESTED: "Not interested / unreachable",
};

export const STATUS_ORDER: ContactStatus[] = [
  "NEW",
  "CALL_DONE",
  "CALL_BACK",
  "NEEDS_VISIT",
  "VISITED",
  "INVITED",
  "ATTENDED",
  "JOINED",
  "NOT_INTERESTED",
];

export const STATUS_TONE: Record<ContactStatus, string> = {
  NEW: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  CALL_DONE: "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  CALL_BACK: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  NEEDS_VISIT: "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  VISITED: "bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
  INVITED: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  ATTENDED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  JOINED: "bg-[#FFE8ED] text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#FFB3C1]",
  NOT_INTERESTED: "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-white/50",
};

export const NEXT_ACTION_LABEL: Record<NextAction, string> = {
  FOLLOW_UP_CALL: "Follow-up call",
  CALL_BACK: "Call back",
  NEEDS_VISIT: "Needs visitation",
  INVITE: "Invite to church",
};

export const ACTION_LABEL: Record<ActionKind, string> = {
  CALL: "Call",
  VISIT: "Visit",
  MESSAGE: "Message",
  NOTE: "Note",
};

export const FLAG_LABEL: Record<FollowUpFlag, string> = {
  DUE: "Due",
  OVERDUE: "Overdue",
  REVIEW: "Needs review",
};

export const FLAG_TONE: Record<FollowUpFlag, string> = {
  DUE: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200",
  OVERDUE: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
  REVIEW: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200",
};

export const REVIEW_LABEL: Record<ReviewOutcome, string> = {
  HANDED_OVER: "Handed over",
  EXTENDED: "Extended",
  CLOSED: "Closed",
};

export const TASK_TYPE_LABEL: Record<TaskType, string> = {
  CALL: "Call",
  VISIT: "Visit",
  INVITE: "Invite to church",
  PRAYER: "Prayer",
  OTHER: "Other",
};

export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = { LOW: "Low", MEDIUM: "Medium", HIGH: "High" };

export const TASK_PRIORITY_TONE: Record<TaskPriority, string> = {
  LOW: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60",
  MEDIUM: "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  HIGH: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = { PENDING: "Pending", IN_PROGRESS: "In progress", DONE: "Done" };

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

/** "+2348031234567" → "0803 123 4567", how people here read a number. */
export function displayPhone(phone: string): string {
  const m = /^\+234(\d{3})(\d{3})(\d{4})$/.exec(phone);
  return m ? `0${m[1]} ${m[2]} ${m[3]}` : phone;
}

export function whatsappLink(phone: string): string {
  return `https://wa.me/${phone.replace(/^\+/, "")}`;
}

/** Today in Lagos as YYYY-MM-DD, for date inputs. */
export function todayLagos(): string {
  return new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function errorText(err: unknown, fallback: string): string {
  const message = (err as { message?: unknown })?.message;
  return typeof message === "string" && message ? message : fallback;
}

export const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#87102C]/40 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 dark:border-white/10 dark:bg-white/5 dark:text-white";

export const labelClass = "mb-1.5 block text-xs font-semibold text-gray-600 dark:text-white/60";
