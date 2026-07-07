"use client";

import { useState } from "react";
import Link from "next/link";
import { useAnnouncementsFeed, useSessionReady } from "@/hooks";
import { useCanMark, useCheckIn } from "@/lib/api";
import CosmicBackdrop from "./CosmicBackdrop";
import SectionHeading from "./SectionHeading";
import AttendancePanel, { type AttendanceState } from "./AttendancePanel";
import AnnouncementsPanel from "./AnnouncementsPanel";
import AnonymousInvitation from "./AnonymousInvitation";
import { firstNameOf } from "./utils";

export default function AttendanceSection() {
  const { user: session, ready: sessionReady } = useSessionReady();
  const [checkedIn, setCheckedIn] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoggedIn = !!session?.loggedIn;
  const { announcements, loading: announcementsLoading } = useAnnouncementsFeed(isLoggedIn);
  const { data: canMarkData, isLoading: canMarkLoading } = useCanMark({ enabled: isLoggedIn });
  const checkIn = useCheckIn();

  async function handleCheckIn() {
    setError(null);
    try {
      await checkIn.mutateAsync();
      setCheckedIn(true);
      setJustCheckedIn(true);
    } catch (err) {
      setError((err as { message?: string }).message ?? "Check-in failed. Please try again.");
    }
  }

  const canMark = isLoggedIn && canMarkData?.canMark === true;
  const alreadyMarked = isLoggedIn && (checkedIn || canMarkData?.reason === "ALREADY_MARKED");
  const firstName = session ? firstNameOf(session) : "friend";

  if (!sessionReady || (isLoggedIn && canMarkLoading)) {
    return (
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1a0610] via-[#0e0407] to-[#1a0610] px-5 py-24 text-white sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[1100px]">
          <div className="mb-6 h-8 w-48 animate-pulse rounded bg-white/10" />
          <div className="h-72 animate-pulse rounded-3xl bg-white/5" />
        </div>
      </section>
    );
  }

  const attendanceState: AttendanceState = alreadyMarked
    ? "checked-in"
    : canMark
      ? "can-check-in"
      : "no-service";
  const attendanceHeading = alreadyMarked
    ? "You're in. God bless you."
    : canMark
      ? "Mark your presence."
      : "Stay close even on quiet days.";

  return (
    <section
      id="attendance"
      className="relative overflow-hidden bg-gradient-to-br from-[#1a0610] via-[#0e0407] to-[#1a0610] px-5 py-24 text-white sm:px-8 sm:py-28"
    >
      <CosmicBackdrop />

      <div className="relative mx-auto max-w-[1100px]">
        {!isLoggedIn ? (
          <>
            <div className="mb-12 sm:mb-14">
              <SectionHeading eyebrow="Today's Service" heading="Walk in. Check in. Be counted." />
            </div>
            <AnonymousInvitation />
          </>
        ) : (
          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
            <AttendancePanel
              eyebrow={`Welcome back, ${firstName}`}
              heading={attendanceHeading}
              state={attendanceState}
              justCheckedIn={justCheckedIn}
              onCheckIn={handleCheckIn}
              loading={checkIn.isPending}
              error={error}
            />
            <AnnouncementsPanel announcements={announcements} loading={announcementsLoading} />
          </div>
        )}

        {isLoggedIn && (
          <p className="mt-10 text-center text-xs text-white/55">
            Track your weekly streak in your{" "}
            <Link
              href="/dashboard"
              className="font-semibold text-amber-300 transition-colors hover:text-amber-200"
            >
              member dashboard →
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
