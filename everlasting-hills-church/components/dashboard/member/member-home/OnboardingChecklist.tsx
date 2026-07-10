import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, ChevronRight, ListChecks } from "lucide-react";
import type { MemberHomeProps } from "./types";
import { muted, linkCl } from "./tokens";
import { getProfileCompletion } from "./helpers";
import { PanelCard } from "./Primitives";
import { ProfileCompletionMeter, NewMemberWelcomeNote, OnboardingCompleteNote } from "./OnboardingExtras";

export function OnboardingChecklist({ member, prayerCount, ministryUnit }: {
  member: MemberHomeProps["member"];
  prayerCount: number;
  ministryUnit?: MemberHomeProps["ministryUnit"];
}) {
  const { pct: profilePct, complete: profileComplete } = getProfileCompletion(member);

  const steps = [
    { label: "Complete your profile",           desc: "Add your bio, phone number, and date of birth.", done: profileComplete,  href: "/dashboard/profile" },
    { label: "Join a ministry unit",             desc: "Connect with a team that fits your calling.",    done: !!ministryUnit,   href: "#" },
    { label: "Submit your first prayer request", desc: "Our team is ready to pray with you.",            done: prayerCount > 0, href: "/dashboard/prayer-requests" },
  ];

  const done = steps.filter((s) => s.done).length;

  return (
    <PanelCard
      kicker="My Journey"
      title="Getting Started"
      icon={ListChecks}
      action={
        <span className={`text-xs font-bold ${muted} tabular-nums`}>{done}/{steps.length}</span>
      }
    >
      {/* Progress track */}
      <div className="h-1.5 rounded-full bg-[#E7CDD3]/50 dark:bg-white/[0.07] mb-6 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-[#87102C]"
          initial={{ width: 0 }}
          animate={{ width: `${(done / steps.length) * 100}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </div>

      <div className="space-y-2.5">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`flex items-start gap-3.5 rounded-2xl px-4 py-3.5 transition-colors ${
              step.done
                ? "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20"
                : "bg-gray-50 dark:bg-white/[0.03] border border-[#E7CDD3]/50 dark:border-white/[0.07]"
            }`}
          >
            <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
              step.done ? "bg-emerald-500" : "bg-[#E7CDD3]/60 dark:bg-white/10"
            }`}>
              {step.done && <CheckCircle2 size={13} className="text-white" strokeWidth={2.5} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold leading-snug ${
                step.done ? "line-through text-emerald-600 dark:text-emerald-400" : "text-[#111] dark:text-white"
              }`}>
                {step.label}
              </p>
              {!step.done && (
                <p className={`text-[11px] ${muted} mt-0.5 leading-relaxed`}>{step.desc}</p>
              )}
            </div>
            {!step.done && (
              <Link href={step.href} className={`${linkCl} mt-0.5`}>
                Go <ChevronRight size={11} />
              </Link>
            )}
          </div>
        ))}
      </div>

      <ProfileCompletionMeter profilePct={profilePct} />

      {/* Pastoral welcome — only for truly new members (nothing done yet) */}
      {done === 0 && <NewMemberWelcomeNote />}

      {done === steps.length && <OnboardingCompleteNote />}
    </PanelCard>
  );
}
