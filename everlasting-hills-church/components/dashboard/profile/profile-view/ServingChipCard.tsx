import { Crown, Star, ShieldCheck } from "lucide-react";
import type { UnitMembership } from "@/components/dashboard/profile/profile-view-model";

/**
 * Serving chip card — real admin-assigned team membership (Unit/UnitMember),
 * distinct from the inferred MinistryChipCard.
 */
export function ServingChipCard({ unit }: { unit: UnitMembership }) {
  const roleLabel = unit.isLead ? "Team Lead" : unit.isAssistant ? "Assistant" : "Team Member";
  const RoleIcon = unit.isLead ? Crown : unit.isAssistant ? Star : ShieldCheck;
  return (
    <div
      className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl p-6
        hover:border-[#E7CDD3] dark:hover:border-white/[0.18] hover:shadow-[0_8px_40px_rgba(135,16,44,0.08)] dark:hover:shadow-[0_8px_40px_rgba(255,255,255,0.03)]
        transition-all duration-300 flex flex-col gap-4 h-full"
    >
      <div className="w-11 h-11 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25 flex items-center justify-center flex-shrink-0">
        <ShieldCheck size={17} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
      </div>
      <div className="flex-1">
        <p className="text-[15px] font-bold text-[#111] dark:text-white leading-snug">{unit.name}</p>
        {unit.description && (
          <p className="text-xs text-[#8a7e80] dark:text-white/45 mt-1.5">{unit.description}</p>
        )}
      </div>
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-semibold w-fit px-2.5 py-1 rounded-full ${
          unit.isLead
            ? "bg-[#87102C] text-white"
            : unit.isAssistant
              ? "bg-[#FFE8ED] text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#FFB3C1]"
              : "bg-[#FFF4F6] text-[#87102C]/80 dark:bg-white/[0.07] dark:text-white/60"
        }`}
      >
        <RoleIcon size={12} aria-hidden="true" />
        {roleLabel}
      </span>
    </div>
  );
}
