import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { ProfileViewModel } from "@/components/dashboard/profile/profile-view-model";
import { ease } from "./constants";

/**
 * Profile completion bar — only counts self-editable fields (photo, bio, phone,
 * address) since gender/DOB/marital status come from the first-timer form or
 * admin records, not the Settings form.
 */
export function CompletionCard({ profile }: { profile: ProfileViewModel }) {
  const checklist = [
    { label: "Profile photo", done: !!profile.photoUrl },
    { label: "Bio", done: !!profile.bio },
    { label: "Phone number", done: !!profile.phone },
    { label: "Home address", done: !!profile.address },
  ];
  const doneCount = checklist.filter((c) => c.done).length;
  const pct = Math.round((doneCount / checklist.length) * 100);
  const missing = checklist.filter((c) => !c.done);

  if (pct === 100) return null;

  return (
    <div className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl p-6 sm:p-7">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={16} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#111] dark:text-white">Complete your profile</p>
            <p className="text-xs text-[#8a7e80] dark:text-white/45 mt-0.5">
              {missing.length} thing{missing.length === 1 ? "" : "s"} left — {missing.map((m) => m.label).join(", ")}
            </p>
          </div>
        </div>
        <span className="text-lg font-extrabold text-[#87102C] dark:text-[#FFB3C1] flex-shrink-0">{pct}%</span>
      </div>

      <div className="h-2 rounded-full bg-[#FFE8ED] dark:bg-white/[0.08] overflow-hidden mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease }}
          className="h-full rounded-full bg-gradient-to-r from-[#87102C] to-[#a01535]"
        />
      </div>

      <Link
        href="/dashboard/settings"
        className="group inline-flex items-center gap-2 text-sm font-semibold text-[#87102C] dark:text-[#FFB3C1] hover:gap-3 transition-all"
      >
        Finish in Settings
        <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
      </Link>
    </div>
  );
}
