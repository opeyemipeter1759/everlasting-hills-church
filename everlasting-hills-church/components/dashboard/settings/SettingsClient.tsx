"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import PersonalInformationForm, {
  type PersonalFormUser,
} from "./PersonalInformationForm";
import ProfileDetailsForm, { type ProfileDetailsUser } from "./ProfileDetailsForm";
import SocialLinksForm, { type SocialLinksUser } from "./SocialLinksForm";
import ProfilePhotoCard from "./ProfilePhotoCard";
import CalendarSubscriptionCard from "./CalendarSubscriptionCard";

interface Props {
  user: PersonalFormUser &
    ProfileDetailsUser &
    SocialLinksUser & {
      photoUrl: string | null;
    };
}

const easeOut = [0.22, 1, 0.36, 1] as const;

function initialsOf(first: string | null, last: string | null) {
  return `${(first ?? "?")[0] ?? ""}${(last ?? "")[0] ?? ""}`.toUpperCase();
}

export default function SettingsClient({ user }: Props) {
  const displayName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Member";

  return (
    <div className="space-y-6">
      {/* Header + breadcrumb */}
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
          <h1 className="text-3xl font-bold text-[#111] dark:text-white tracking-tight">Settings</h1>
          {/* Notification settings live on their own page because every control
              there depends on browser state. Nothing linked to it, which is why
              no member had ever reached it to turn push on. */}
          <Link
            href="/dashboard/settings/notifications"
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#87102C] hover:underline dark:text-[#FFB3C1]"
          >
            <Bell size={14} /> Notification settings
          </Link>
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
          <span className="text-[#87102C] dark:text-[#FFB3C1] font-semibold">Settings</span>
        </nav>
      </motion.header>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.9fr] gap-6">
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: easeOut }}
          >
            <PersonalInformationForm user={user} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.14, ease: easeOut }}
          >
            <ProfileDetailsForm user={user} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2, ease: easeOut }}
          >
            <SocialLinksForm user={user} />
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18, ease: easeOut }}
          >
            <ProfilePhotoCard
              initialPhotoUrl={user.photoUrl}
              fallbackInitials={initialsOf(user.firstName, user.lastName)}
              displayName={displayName}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24, ease: easeOut }}
          >
            <CalendarSubscriptionCard />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
