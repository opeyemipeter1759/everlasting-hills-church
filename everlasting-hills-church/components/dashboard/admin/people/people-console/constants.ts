import type { DirectoryParams, PersonRole } from "@/lib/api/people";

export const DEFAULT_PARAMS: DirectoryParams = {
  page: 1,
  limit: 50,
  search: "",
  role: "",
  status: "",
  gender: "",
  unit: "",
  hasUnit: "",
  joinedFrom: "",
  joinedTo: "",
  birthMonth: "",
  sortBy: "joinedAt",
  sortOrder: "desc",
};

export type Chip =
  | { key: "all"; label: string }
  | { key: "role"; label: string; role: PersonRole }
  | { key: "noUnit"; label: string };

export const ROLE_CHIPS: Chip[] = [
  { key: "all", label: "All" },
  { key: "role", label: "Pastors", role: "PASTOR" },
  { key: "role", label: "Admins", role: "ADMIN" },
  { key: "role", label: "Head Ushers", role: "HEAD_USHER" },
  { key: "role", label: "Unit Leads", role: "UNIT_LEAD" },
  { key: "role", label: "Members", role: "MEMBER" },
  { key: "noUnit", label: "No team" },
];

export const btnPrimaryHdr =
  "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-colors";
export const btnSecondary =
  "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E7CDD3] dark:border-white/10 bg-white dark:bg-white/5 text-sm font-semibold text-gray-700 dark:text-white/70 hover:bg-[#FFF4F6] dark:hover:bg-white/10 transition-colors";
export const pagerBtn =
  "inline-flex items-center justify-center h-8 w-8 rounded-lg border border-[#E7CDD3] dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-white/60 hover:bg-[#FFF4F6] dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors";
