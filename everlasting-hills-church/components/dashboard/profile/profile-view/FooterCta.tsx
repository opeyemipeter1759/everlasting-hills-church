import Link from "next/link";
import ScrollReveal from "@/components/home/ScrollReveal";
import { ArrowRight, Users } from "lucide-react";

/** Section 6 — Church identity + quick action buttons (secondary + primary CTA). */
export function FooterCta() {
  return (
    <ScrollReveal delay={0.05}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5
        p-6 sm:p-8 bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl
        hover:border-[#E7CDD3] dark:hover:border-white/[0.18] hover:shadow-[0_8px_40px_rgba(135,16,44,0.06)] dark:hover:shadow-none
        transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25 flex items-center justify-center flex-shrink-0">
            <Users size={19} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#111] dark:text-white">Part of the EHC Family</p>
            <p className="text-xs text-[#8a7e80] dark:text-white/45 mt-0.5">
              Everlasting Hills Church · Ibadan, Nigeria
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href="/prayer-request"
            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full
              border border-[#E7CDD3] dark:border-white/20 text-[#87102C] dark:text-white/80 text-sm font-semibold
              hover:bg-[#FFF4F6] dark:hover:bg-white/[0.07] transition-colors
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#87102C]"
          >
            Submit Prayer
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </a>
          <Link
            href="/dashboard/settings"
            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full
              bg-[#87102C] text-white text-sm font-semibold
              hover:bg-[#6E0C24] hover:shadow-lg hover:shadow-[#87102C]/25 hover:-translate-y-0.5
              transition-all duration-200
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#87102C]"
          >
            Edit Profile
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </ScrollReveal>
  );
}
