import Link from "next/link";
import { motion } from "framer-motion";
import { LayoutDashboard } from "lucide-react";
import { ease } from "./constants";

/** Section 1 — section label + page title + breadcrumb. */
export function PageHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease }}
      className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <p className="text-[#87102C] dark:text-white/40 text-xs tracking-[0.2em] uppercase font-semibold mb-2">
          Member Portal
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#111] dark:text-white tracking-tight leading-[1.1] text-balance">
          My Profile
        </h1>
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
