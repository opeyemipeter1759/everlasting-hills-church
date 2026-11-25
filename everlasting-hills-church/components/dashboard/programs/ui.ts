/** The dashboard's form kit, as used across the admin screens (light and dark). */
export const card = "rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-[#161618] sm:p-5";
export const input =
  "min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-base text-[#111] placeholder:text-gray-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#87102C] dark:border-white/15 dark:bg-white/5 dark:text-white sm:text-sm";
export const selectBox = `${input} text-left`;
export const label = "block text-sm font-semibold text-[#111] dark:text-white/90";
export const hint = "mt-1 text-xs text-gray-600 dark:text-white/55";
export const button =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#87102C] disabled:cursor-not-allowed disabled:opacity-60";
export const primary = `${button} bg-[#87102C] text-white hover:bg-[#6E0C24]`;
export const secondary = `${button} border border-gray-300 text-gray-800 hover:bg-gray-50 dark:border-white/15 dark:text-white/85 dark:hover:bg-white/10`;
export const danger = `${button} border border-red-200 text-red-700 hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10`;
export const sectionTitle = "text-base font-bold text-[#111] dark:text-white";

export const STATUS_CHIP: Record<"DRAFT" | "PUBLISHED" | "ARCHIVED", { label: string; cls: string }> = {
  PUBLISHED: { label: "Published", cls: "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200" },
  DRAFT: { label: "Draft", cls: "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-white/75" },
  ARCHIVED: { label: "Archived", cls: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300" },
};

export const TYPE_OPTIONS = [
  { value: "PRAYER", label: "Prayer" },
  { value: "PROPHETIC", label: "Prophetic" },
  { value: "CONSECRATION", label: "Consecration" },
  { value: "CONFERENCE", label: "Conference" },
  { value: "HOLY_GHOST", label: "Holy Ghost" },
  { value: "OTHER", label: "Other" },
];
export const FORMAT_OPTIONS = [
  { value: "IN_PERSON", label: "In person" },
  { value: "ONLINE", label: "Online" },
  { value: "HYBRID", label: "In person and online" },
];
export const ACCENT_OPTIONS = [
  { value: "BURGUNDY", label: "Burgundy", swatch: "#87102C" },
  { value: "CRIMSON", label: "Crimson", swatch: "#8B1A3A" },
  { value: "DEEP_BURGUNDY", label: "Deep burgundy", swatch: "#4a0819" },
  { value: "GOLD", label: "Gold", swatch: "#C8A04A" },
];
