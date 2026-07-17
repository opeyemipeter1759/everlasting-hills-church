"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, MapPin, BookOpen } from "lucide-react";
import { useCanMark, useCheckIn } from "@/lib/api";
import type { MemberHomeProps } from "./types";
import { fmtDate, fmtTime } from "./helpers";
import { CosmicBackdrop } from "./CosmicBackdrop";
import { ServiceDayCenter, CheckedInCenter } from "./CheckInCenters";
import { NoServiceCenter } from "./NoServiceCenter";

export function CheckInPanel({
  todayService, hasCheckedInToday, nextService,
}: {
  todayService: MemberHomeProps["todayService"];
  hasCheckedInToday: boolean;
  nextService: MemberHomeProps["nextService"];
}) {
  const router = useRouter();
  const { data: canMarkData, isLoading: canMarkLoading } = useCanMark();
  const checkIn = useCheckIn();
  const [error, setError] = useState("");

  const canMark = canMarkData?.canMark === true;
  const alreadyMarked = canMarkData?.reason === "ALREADY_MARKED";
  const checkedIn = hasCheckedInToday || alreadyMarked || checkIn.isSuccess;

  // Derive service context from the API response or props
  const isServiceDay = canMark || checkedIn || !!todayService;
  const serviceName = todayService?.name ?? "Everlasting Hills";
  const todayDay = new Date().getDay();
  const serviceTime = todayDay === 0 ? "9:00 AM" : todayDay === 3 ? "5:30 PM" : null;

  async function handleCheckIn() {
    setError("");
    try {
      await checkIn.mutateAsync();
      // My Journey stats (attendance rate, streak, etc.) are fetched
      // server-side, so refresh the route to pull the post-check-in values.
      router.refresh();
    } catch (err) {
      setError((err as { message?: string }).message ?? "Check-in failed. Please try again.");
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a0610] via-[#0e0407] to-[#1a0610] border border-white/[0.07] min-h-[440px] shadow-[0_8px_40px_rgba(0,0,0,0.35)]">
      <CosmicBackdrop />

      <div className="relative z-10 flex flex-col h-full p-7 sm:p-8">
        {/* Header */}
        <div className="mb-6">
          <p className="text-[10px] tracking-[0.3em] uppercase font-bold text-[#FFB3C1]/70">
            {isServiceDay ? "Today's Service" : "Next Service"}
          </p>
          <h2 className="text-white text-xl sm:text-2xl font-bold mt-1.5">{serviceName}.</h2>

          {isServiceDay && serviceTime && (
            <div className="flex flex-wrap items-center gap-3 mt-2.5">
              <span className="flex items-center gap-1.5 text-white/45 text-[11px]">
                <Clock size={11} className="text-[#FFB3C1]/50" />
                {serviceTime}
              </span>
              <span className="w-px h-3 bg-white/15" />
              <span className="flex items-center gap-1.5 text-white/45 text-[11px]">
                <MapPin size={11} className="text-[#FFB3C1]/50" />
                Hills Auditorium, Ibadan
              </span>
              {todayService?.sermonTitle && (
                <>
                  <span className="w-px h-3 bg-white/15" />
                  <span className="flex items-center gap-1.5 text-white/45 text-[11px]">
                    <BookOpen size={11} className="text-[#FFB3C1]/50" />
                    <span className="italic">{todayService.sermonTitle}</span>
                  </span>
                </>
              )}
            </div>
          )}

          {!isServiceDay && nextService && (
            <p className="text-white/35 text-[11px] mt-2">
              {fmtDate(nextService.scheduledAt, { weekday: "short", day: "numeric", month: "short" })}
              {" · "}{fmtTime(nextService.scheduledAt)}
            </p>
          )}

          <div className="h-px w-10 bg-white/20 mt-3.5" />
        </div>

        {/* Center stage */}
        <div className="flex-1 flex items-center justify-center py-6">
          {canMarkLoading ? (
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-white/20 border-t-white/70 rounded-full"
            />
          ) : checkedIn
            ? <CheckedInCenter />
            : canMark
            ? <ServiceDayCenter onClick={handleCheckIn} loading={checkIn.isPending} />
            : <NoServiceCenter nextService={nextService} />}
        </div>

        {error && (
          <p className="text-center text-xs text-red-300 bg-red-500/10 border border-red-400/25 rounded-xl px-3 py-2 mt-2">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
