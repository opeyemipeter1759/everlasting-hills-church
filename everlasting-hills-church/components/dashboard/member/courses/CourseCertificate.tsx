"use client";

import { forwardRef } from "react";
import { Star } from "lucide-react";

export interface CourseCertificateProps {
  memberName: string;
  courseTitle: string;
  completedAt: string | null;
  certificateNo: string;
}

/** A single hand-drawn corner scroll — rotated/mirrored per corner via the
 * container's `scale` transform rather than four separate paths. */
function CornerFlourish({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <g fill="none" stroke="#87102C" strokeLinecap="round">
        <path d="M2 34 Q2 2 34 2" strokeWidth="2.5" />
        <path d="M2 50 Q2 18 50 2" strokeWidth="1.25" opacity="0.55" />
        <path d="M2 66 Q2 34 26 22 Q40 15 44 2" strokeWidth="1.25" opacity="0.55" />
        <circle cx="44" cy="2" r="3" fill="#87102C" stroke="none" />
        <circle cx="2" cy="44" r="3" fill="#87102C" stroke="none" />
        <path d="M2 80 Q2 60 16 54" strokeWidth="1" opacity="0.3" />
        <path d="M80 2 Q60 2 54 16" strokeWidth="1" opacity="0.3" />
      </g>
    </svg>
  );
}

function Divider({ wide }: { wide?: boolean }) {
  return (
    <div className="flex items-center justify-center gap-2.5" aria-hidden="true">
      <span className={`h-px bg-[#87102C]/40 ${wide ? "w-24" : "w-14"}`} />
      <span className="h-1.5 w-1.5 rotate-45 bg-[#87102C]/50" />
      <span className={`h-px bg-[#87102C]/40 ${wide ? "w-24" : "w-14"}`} />
    </div>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Pure, fixed-size (1200×848) presentational certificate — sized in real pixels
 * rather than responsive units so html-to-image rasterizes it identically to what's
 * on screen. The parent scales it down to fit smaller viewports via CSS transform.
 */
const CourseCertificate = forwardRef<HTMLDivElement, CourseCertificateProps>(
  ({ memberName, courseTitle, completedAt, certificateNo }, ref) => {
    return (
      <div
        ref={ref}
        className="relative flex-shrink-0 overflow-hidden bg-[#FAF6F0]"
        style={{ width: 1200, height: 848 }}
      >
        <div aria-hidden="true" className="absolute inset-5 border-2 border-[#87102C]/70" />
        <div aria-hidden="true" className="absolute inset-[26px] border border-[#87102C]/25" />

        <CornerFlourish className="absolute left-7 top-7 h-16 w-16" />
        <CornerFlourish className="absolute right-7 top-7 h-16 w-16 -scale-x-100" />
        <CornerFlourish className="absolute bottom-7 left-7 h-16 w-16 -scale-y-100" />
        <CornerFlourish className="absolute bottom-7 right-7 h-16 w-16 -scale-x-100 -scale-y-100" />

        <div className="relative flex h-full flex-col items-center px-28 py-14 text-center">
          {/* The actual app logo mark (the light-background variant — the sidebar's
              white version would be invisible on this cream paper). A plain <img>,
              not next/image, so html-to-image can rasterize it reliably. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logoblack.png" alt="Everlasting Hills Church" className="h-14 w-auto object-contain" />

          <p className="mt-3 text-xs font-bold tracking-[0.4em] text-[#87102C]">EVERLASTING HILLS CHURCH</p>

          <h1 className="mt-8 font-serif text-6xl font-bold leading-tight text-[#87102C]">
            Certificate of Training
          </h1>
          <p className="mt-2 text-sm font-bold tracking-[0.35em] text-[#5c4a4f]">OF ACHIEVEMENT</p>

          <div className="mt-7">
            <Divider />
          </div>

          <p className="mt-9 font-serif text-lg italic text-[#5c4a4f]">Proudly Presented to</p>
          <p
            className="mt-2 text-6xl font-bold text-[#87102C]"
            style={{ fontFamily: "var(--font-dancing)" }}
          >
            {memberName}
          </p>

          <div className="mt-5">
            <Divider wide />
          </div>

          <p className="mt-8 max-w-2xl font-serif text-lg italic leading-relaxed text-[#5c4a4f]">
            For Completing the &ldquo;{courseTitle}&rdquo; Course
          </p>

          <div className="mt-auto flex w-full items-end justify-between pt-10">
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a7e80]">Issued</p>
              <p className="mt-1 text-sm font-semibold text-[#111]">{formatDate(completedAt)}</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-[3px] border-[#D4AF37] bg-gradient-to-br from-[#F5D571] via-[#D4AF37] to-[#9c7a1f] shadow-md">
                <Star size={24} className="text-white" fill="currentColor" />
              </div>
              <div className="-mt-0.5 flex gap-1.5">
                <span
                  className="h-6 w-3.5 bg-[#87102C]"
                  style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 72%, 0 100%)" }}
                />
                <span
                  className="h-6 w-3.5 bg-[#6E0C24]"
                  style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 72%, 0 100%)" }}
                />
              </div>
            </div>

            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a7e80]">Certificate No.</p>
              <p className="mt-1 text-sm font-semibold text-[#111]">{certificateNo}</p>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
CourseCertificate.displayName = "CourseCertificate";

export default CourseCertificate;
