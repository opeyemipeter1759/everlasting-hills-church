/** Words for the audit trail page. */

const AREA_WORDS: Record<string, string> = {
  cms: "Public site (CMS)",
  ai: "AI",
  "nav-permissions": "Permissions",
  "first-timer-team": "First Timer Team",
  "opening-message": "Welcome queue",
  "message-templates": "Message templates",
  "routing-rules": "Follow-up routing",
  "status-reports": "Status reports",
  "service-readiness": "Service readiness",
  "one-on-one": "One-on-One",
  "home-cell": "Home cells",
  visitors: "First-timers",
  users: "People and roles",
};

/** "service-teams" → "Service teams"; a few have their own names. */
export function areaLabel(area: string): string {
  if (AREA_WORDS[area]) return AREA_WORDS[area];
  const words = area.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[-_]/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export type Tone = "add" | "change" | "remove" | "other";

/** Colour by what the change did: added, changed or removed. */
export function toneOf(method: string | null, action?: string): Tone {
  const verb = method ?? action ?? "";
  if (verb === "POST" || verb === "CREATE") return "add";
  if (verb === "DELETE") return "remove";
  if (verb === "PATCH" || verb === "PUT" || verb === "UPDATE" || verb === "PUBLISH" || verb === "UNPUBLISH") return "change";
  return "other";
}

export function whenText(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  });
}

/** "firstName" → "First name". */
export function fieldLabel(key: string): string {
  const words = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** A stored value as one line of text, or null when it needs the nested view. */
export function plainValue(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number" || typeof value === "string") return String(value);
  if (Array.isArray(value) && value.every((v) => typeof v !== "object" || v === null)) return value.map((v) => String(v ?? "—")).join(", ") || "—";
  return null;
}

/** The fields of a stored object, or nothing when it is not one. */
export function fieldsOf(value: unknown): [string, unknown][] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>);
}
