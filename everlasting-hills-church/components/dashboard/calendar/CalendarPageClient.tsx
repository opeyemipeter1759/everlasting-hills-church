"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import ConnectPersonalGoogleCalendarCard from "@/components/dashboard/calendar/ConnectPersonalGoogleCalendarCard";
import MemberCalendarView from "@/components/dashboard/calendar/MemberCalendarView";

const easeOut = [0.22, 1, 0.36, 1] as const;

export default function CalendarPageClient() {
  return (
    <div className="space-y-6">
      <motion.header
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: easeOut }}
        className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="text-[10px] tracking-[0.28em] uppercase font-semibold text-[#87102C]/80 dark:text-white/40 mb-1.5">
            Member Portal
          </p>
          <h1 className="text-3xl font-bold text-[#111] dark:text-white tracking-tight">Calendar</h1>
          <p className="mt-1 text-sm text-[#8a7e80] dark:text-white/50">
            Connect your Google Calendar to see your own events alongside the church calendar.
          </p>
        </div>
        <nav
          aria-label="Breadcrumb"
          className="text-sm flex items-center gap-2 text-[#8a7e80] dark:text-white/45"
        >
          <Link
            href="/dashboard"
            className="hover:text-[#111] dark:hover:text-white transition-colors"
          >
            Dashboard
          </Link>
          <span aria-hidden="true" className="text-[#cbb9bd] dark:text-white/20">
            /
          </span>
          <span className="text-[#87102C] dark:text-[#FFB3C1] font-semibold">Calendar</span>
        </nav>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.08, ease: easeOut }}
        className="max-w-2xl"
      >
        <ConnectPersonalGoogleCalendarCard />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.14, ease: easeOut }}
      >
        <MemberCalendarView />
      </motion.div>
    </div>
  );
}
