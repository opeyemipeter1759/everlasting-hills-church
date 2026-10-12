import Link from "next/link";
import { motion } from "framer-motion";
import { Award, LayoutDashboard, Users } from "lucide-react";
import { ease } from "./constants";

/** Section 1 — section label + page title + breadcrumb. */
export function PageHeader({ memberId = null }: { memberId?: string | null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease }}
      className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <p className="text-[#87102C] dark:text-white/40 text-xs tracking-[0.1em] xs:tracking-[0.2em] uppercase font-semibold mb-2">
          Member Portal
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#111] dark:text-white tracking-tight leading-[1.1] text-balance">
          My Profile
        </h1>
        <div className="mt-3 flex flex-wrap gap-2">
          {/* The profile others see: badges, articles and encouragement, ready to share. */}
          {memberId && (
            <Link
              href={`/dashboard/family/${memberId}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#87102C] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#6E0C24]"
            >
              <Award size={15} aria-hidden="true" /> My badges &amp; shareable profile
            </Link>
          )}
          <Link
            href="/dashboard/family"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#E7CDD3] px-4 text-sm font-semibold text-[#87102C] transition-colors hover:bg-[#FFF4F6] dark:border-white/[0.14] dark:text-[#FFB3C1] dark:hover:bg-white/[0.06]"
          >
            <Users size={15} aria-hidden="true" /> Browse the church family
          </Link>
        </div>
      </div>

      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-[#8a7e80] dark:text-white/45">
        <LayoutDashboard size={14} aria-hidden="true" />
        <Link href="/dashboard" className="hover:text-[#111] dark:hover:text-white transition-colors">
          Dashboard
        </Link>
        <span aria-hidden="true" className="text-[#cbb9bd] dark:text-white/20">/</span>
        <span className="font-semibold text-[#87102C] dark:text-[#FFB3C1]">Profile</span>
      </nav>
    </motion.div>
  );
}
