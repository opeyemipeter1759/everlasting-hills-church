import type { PersonRole } from "@/lib/api/people";

export const ROLE_LABEL: Record<PersonRole, string> = {
  SUPER_ADMIN: "Super Admin",
  PASTOR: "Pastor",
  ADMIN: "Admin",
  ADMIN_HEAD: "Admin Head",
  HOD: "Head of Department",
  HEAD_USHER: "Head Usher",
  UNIT_LEAD: "Unit Lead",
  MEMBER: "Member",
  VISITOR: "Visitor",
};

/** Brand-aligned role badge. Burgundy for leadership, muted for members. */
export const ROLE_BADGE: Record<PersonRole, string> = {
  SUPER_ADMIN: "bg-[#87102C] text-white border-transparent",
  PASTOR:
    "bg-[#FFE8ED] text-[#87102C] border-[#E7CDD3] dark:bg-[#87102C]/25 dark:text-[#e8768a] dark:border-[#87102C]/40",
  ADMIN:
    "bg-[#FFF4F6] text-[#87102C] border-[#E7CDD3] dark:bg-[#87102C]/15 dark:text-[#e8768a] dark:border-white/10",
  ADMIN_HEAD:
    "bg-[#FFF4F6] text-[#9b3050] border-[#E7CDD3] dark:bg-white/5 dark:text-[#e8a3b3] dark:border-white/10",
  HOD:
    "bg-[#FFF4F6] text-[#9b3050] border-[#E7CDD3] dark:bg-white/5 dark:text-[#e8a3b3] dark:border-white/10",
  HEAD_USHER:
    "bg-[#FFF4F6] text-[#9b3050] border-[#E7CDD3] dark:bg-white/5 dark:text-[#e8a3b3] dark:border-white/10",
  UNIT_LEAD:
    "bg-[#FFF4F6] text-[#9b3050] border-[#E7CDD3] dark:bg-white/5 dark:text-[#e8a3b3] dark:border-white/10",
  MEMBER: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10",
  VISITOR: "bg-gray-50 text-gray-500 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10",
};

export const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  INACTIVE: "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400",
  TRANSFERRED: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  DECEASED: "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400",
};

export const STATUS_OPTIONS = ["ACTIVE", "INACTIVE", "TRANSFERRED", "DECEASED"] as const;
