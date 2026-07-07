"use client";

import SectionHeading from "./SectionHeading";
import ServiceDayHero from "./ServiceDayHero";
import NoServiceHero from "./NoServiceHero";
import CheckedInHero from "./CheckedInHero";

export type AttendanceState = "checked-in" | "can-check-in" | "no-service";

interface AttendancePanelProps {
  eyebrow: string;
  heading: string;
  state: AttendanceState;
  justCheckedIn: boolean;
  onCheckIn: () => void;
  loading: boolean;
  error: string | null;
}

export default function AttendancePanel({
  eyebrow,
  heading,
  state,
  justCheckedIn,
  onCheckIn,
  loading,
  error,
}: AttendancePanelProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.02] px-6 pb-8 pt-7 sm:px-8 sm:pt-8">
      <SectionHeading eyebrow={eyebrow} heading={heading} compact />
      <div className="mt-6 flex flex-1 items-center justify-center">
        {state === "checked-in" ? (
          <CheckedInHero justCheckedIn={justCheckedIn} />
        ) : state === "can-check-in" ? (
          <ServiceDayHero onClick={onCheckIn} loading={loading} error={error} />
        ) : (
          <NoServiceHero />
        )}
      </div>
    </div>
  );
}
