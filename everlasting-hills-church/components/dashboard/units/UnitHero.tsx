"use client";

import { motion } from "framer-motion";
import { Crown, ListChecks, MessageCircle, Users2 } from "lucide-react";
import type { UnitDetail } from "@/types";
import RefreshButton from "@/components/ui/button/RefreshButton";
import { fadeUp } from "./SectionCard";

export default function UnitHero({
  unit,
  myTasksTotal,
  myTasksDone,
  leaderName,
  canMessage,
  onMessageSomeone,
  onRefresh,
  isRefreshing,
}: {
  unit: UnitDetail;
  myTasksTotal: number;
  myTasksDone: number;
  leaderName: string | null;
  canMessage: boolean;
  onMessageSomeone: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  return (
    <motion.div
      {...fadeUp()}
      className="relative overflow-hidden rounded-2xl"
      style={{ background: "linear-gradient(155deg, #2a0410 0%, #4a0819 35%, #87102C 75%, #a01535 100%)" }}
    >
      <div aria-hidden="true" className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div aria-hidden="true" className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-amber-300/10 blur-3xl pointer-events-none" />
      <div aria-hidden="true" className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 select-none text-[70px] font-black leading-none tracking-tight text-white/[0.05]">
        EHC
      </div>

      <div className="relative z-10 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
            <Users2 size={22} className="text-white" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#FFB3C1] mb-1">My Unit</p>
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-white truncate">{unit.name}</h1>
            {unit.description && <p className="mt-1.5 text-sm text-white/60 max-w-lg">{unit.description}</p>}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur-sm">
            <Users2 size={13} aria-hidden="true" />
            {unit.UnitMember.length} member{unit.UnitMember.length !== 1 ? "s" : ""}
          </span>
          {myTasksTotal > 0 && (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur-sm">
              <ListChecks size={13} aria-hidden="true" />
              {myTasksDone}/{myTasksTotal} of my tasks done
            </span>
          )}
          {leaderName && (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur-sm">
              <Crown size={13} aria-hidden="true" />
              Led by {leaderName}
            </span>
          )}
          {canMessage && (
            <button
              type="button"
              onClick={onMessageSomeone}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#87102C] transition-colors hover:bg-white/90"
            >
              <MessageCircle size={13} aria-hidden="true" />
              Message someone
            </button>
          )}
          <RefreshButton
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
            variant="dark"
            className="!rounded-full !px-4 !py-2"
          />
        </div>
      </div>
    </motion.div>
  );
}
