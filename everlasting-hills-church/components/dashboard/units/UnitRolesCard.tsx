"use client";

import { BadgeCheck } from "lucide-react";
import type { UnitMemberEntry } from "@/types";
import SectionCard from "./SectionCard";

export default function UnitRolesCard({
  roles,
  delay,
}: {
  roles: Record<string, UnitMemberEntry[]>;
  delay?: number;
}) {
  const entries = Object.entries(roles);
  if (entries.length === 0) return null;

  return (
    <SectionCard icon={BadgeCheck} title="Roles" count={entries.length} delay={delay}>
      <div className="flex flex-wrap gap-2">
        {entries.map(([roleName, members]) => (
          <span
            key={roleName}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E7CDD3] dark:border-white/10 bg-[#FFF4F6] dark:bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#9b3050] dark:text-[#e8a3b3]"
          >
            {roleName}
            <span className="opacity-60">· {members.map((m) => m.Member.firstName).join(", ")}</span>
          </span>
        ))}
      </div>
    </SectionCard>
  );
}
