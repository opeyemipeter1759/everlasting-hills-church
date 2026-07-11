"use client";

import { initials } from "./format";

export function Avatar({
  photoUrl,
  firstName,
  lastName,
  size = 40,
}: {
  photoUrl: string | null;
  firstName: string;
  lastName: string;
  size?: number;
}) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt=""
        style={{ width: size, height: size }}
        className="rounded-full object-cover flex-shrink-0"
      />
    );
  }
  return (
    <span
      style={{ width: size, height: size }}
      className="rounded-full bg-[#87102C]/10 dark:bg-[#87102C]/25 flex items-center justify-center text-xs font-bold text-[#87102C] dark:text-[#e8768a] flex-shrink-0"
    >
      {initials(firstName, lastName)}
    </span>
  );
}

export function ProfileCompletionMeter({ value }: { value: number }) {
  const tone = value >= 80 ? "bg-emerald-500" : value >= 50 ? "bg-[#87102C]" : "bg-amber-500";
  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="h-1.5 flex-1 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full ${tone} transition-all`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[11px] font-semibold tabular-nums text-gray-500 dark:text-white/50 w-8 text-right">
        {value}%
      </span>
    </div>
  );
}
