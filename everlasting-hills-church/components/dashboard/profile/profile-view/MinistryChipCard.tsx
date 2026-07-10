import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { MinistryInfo } from "./ministries";

/** Ministry chip card — read-only since gender/DOB aren't self-editable yet. */
export function MinistryChipCard({ ministry }: { ministry: MinistryInfo }) {
  const Icon = ministry.icon;
  return (
    <Link
      href={`/ministries/${ministry.slug}`}
      className="group bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl p-6
        hover:border-[#E7CDD3] dark:hover:border-white/[0.18] hover:shadow-[0_8px_40px_rgba(135,16,44,0.08)] dark:hover:shadow-[0_8px_40px_rgba(255,255,255,0.03)] hover:-translate-y-1
        transition-all duration-300 flex flex-col gap-4 h-full"
    >
      <div className="w-11 h-11 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25 flex items-center justify-center flex-shrink-0">
        <Icon size={17} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
      </div>
      <div className="flex-1">
        <p className="text-[15px] font-bold text-[#111] dark:text-white leading-snug">{ministry.name}</p>
        <p className="text-xs text-[#8a7e80] dark:text-white/45 mt-1.5">{ministry.schedule}</p>
      </div>
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#87102C] dark:text-[#FFB3C1]
        group-hover:gap-2.5 transition-all">
        View ministry
        <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
      </span>
    </Link>
  );
}
