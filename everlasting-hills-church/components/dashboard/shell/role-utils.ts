export type UserRole =
  | "SUPER_ADMIN"
  | "PASTOR"
  | "ADMIN"
  | "UNIT_LEAD"
  | "MEMBER"
  | "VISITOR";

const LEVELS: Record<UserRole, number> = {
  VISITOR: 0,
  MEMBER: 1,
  UNIT_LEAD: 2,
  ADMIN: 3,
  PASTOR: 4,
  SUPER_ADMIN: 5,
};

export function hasMinRole(userRole: UserRole, minRole: UserRole): boolean {
  return (LEVELS[userRole] ?? 0) >= (LEVELS[minRole] ?? 0);
}

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  PASTOR: "Pastor",
  ADMIN: "Admin",
  UNIT_LEAD: "Unit Lead",
  MEMBER: "Member",
  VISITOR: "Visitor",
};

export const ROLE_BADGE_CLASS: Record<UserRole, string> = {
  SUPER_ADMIN: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
  PASTOR: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  ADMIN: "bg-sky-500/20 text-sky-300 border border-sky-500/30",
  UNIT_LEAD: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  MEMBER: "bg-white/10 text-white/50 border border-white/10",
  VISITOR: "bg-white/10 text-white/50 border border-white/10",
};
