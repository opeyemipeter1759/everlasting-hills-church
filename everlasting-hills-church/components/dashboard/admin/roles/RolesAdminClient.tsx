"use client";

import {
  Shield, Crown, ShieldCheck, Building2, Network, Tally5, Users, User, RefreshCw,
} from "lucide-react";
import { useUserRoles, type RoleEntry } from "@/lib/api";
import { useAssignableRoles, type PersonRole } from "@/lib/api/people";
import RolesPageSkeleton from "@/components/ui/skeleton/RolesPageSkeleton";
import GlobalRolesSection from "./GlobalRolesSection";


const GRANTABLE: PersonRole[] = ["SUPER_ADMIN", "PASTOR", "ADMIN_HEAD", "HEAD_USHER"];

const ROLE_ICON: Record<string, React.ElementType> = {
  SUPER_ADMIN: ShieldCheck,
  PASTOR: Crown,
  ADMIN: Shield,
  ADMIN_HEAD: Building2,
  HOD: Network,
  HEAD_USHER: Tally5,
  UNIT_LEAD: Users,
  MEMBER: User,
  VISITOR: User,
};

export default function RolesAdminClient() {
  const rollup = useUserRoles();
  const assignable = useAssignableRoles();
  const grantable = GRANTABLE.filter((r) => assignable.data?.includes(r));

  if (rollup.isLoading || assignable.isLoading) {
    return <RolesPageSkeleton />;
  }

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#e8768a]">
            Administration
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Roles</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-white/50">
            Super Admin → Pastor → Admin Head → HOD → Unit Lead. Each level appoints the one below it.
          </p>
        </div>
        <button
          type="button"
          onClick={() => rollup.refetch()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
        >
          <RefreshCw size={12} className={rollup.isFetching ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Role rollup */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {rollup.data?.map((r) => <RoleStat key={r.role} entry={r} />)}
      </div>

      {/* Global role grants */}
      <GlobalRolesSection grantable={grantable} />
    </div>
  );
}

function RoleStat({ entry }: { entry: RoleEntry }) {
  const Icon = ROLE_ICON[entry.role] ?? User;
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-4">
      <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-[#87102C]/10 dark:bg-[#87102C]/15">
        <Icon size={15} className="text-[#87102C] dark:text-[#e8768a]" />
      </div>
      <p className="text-xl font-black text-gray-900 dark:text-white">{entry.count}</p>
      <p className="mt-0.5 text-[11px] font-semibold text-gray-400 dark:text-white/40">{entry.label}</p>
    </div>
  );
}
