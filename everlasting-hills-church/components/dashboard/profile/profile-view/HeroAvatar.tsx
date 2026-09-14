"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

export function HeroAvatar({ photoUrl, displayName, initials }: {
  photoUrl: string | null;
  displayName: string;
  initials: string;
}) {
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);
  const hasPhoto = !!photoUrl && photoUrl !== failedPhotoUrl;

  return (
    <div className="relative isolate mx-auto w-44 max-w-full shrink-0 sm:mx-0 sm:w-52 xl:w-56">
      <div aria-hidden="true" className="pointer-events-none absolute -inset-7 -z-10 rounded-full bg-[#efc98b]/20 blur-2xl" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-2 -z-10 -rotate-6 rounded-t-[7rem] rounded-b-[2rem] border border-[#edc991]/50"
      />

      <div className="relative rounded-t-[7rem] rounded-b-[2rem] bg-gradient-to-br from-[#fff9ed] via-[#f5dfba] to-[#cda56c] p-2 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
        <div className="relative aspect-[4/5] overflow-hidden rounded-t-[6.5rem] rounded-b-[1.5rem] bg-[#4a1728]">
          {hasPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={`${displayName}'s profile photo`}
              width={320}
              height={400}
              decoding="async"
              onError={() => setFailedPhotoUrl(photoUrl)}
              className="h-full w-full object-cover object-[center_35%]"
            />
          ) : (
            <div
              role="img"
              aria-label={`${displayName}'s profile initials`}
              className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#a95261] via-[#782e45] to-[#36101f]"
            >
              <div aria-hidden="true" className="absolute inset-3 rounded-t-[6rem] rounded-b-2xl border border-[#f5dfba]/25" />
              <div aria-hidden="true" className="absolute -bottom-14 -left-12 h-44 w-44 rounded-full border border-[#f5dfba]/20" />
              <div aria-hidden="true" className="absolute -right-16 -top-12 h-48 w-48 rounded-full border border-[#f5dfba]/20" />
              <span className="relative font-serif text-6xl font-semibold tracking-wide text-[#fff4df] sm:text-7xl">
                {initials}
              </span>
            </div>
          )}
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-2 -right-2 flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-[#5b172a] bg-[#f5dfba] text-[#782e45] shadow-lg"
      >
        <Sparkles size={19} strokeWidth={1.5} />
      </div>
    </div>
  );
}
