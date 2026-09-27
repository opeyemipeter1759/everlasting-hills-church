"use client";

import Image from "next/image";
import { fullTimestamp, timeLabel } from "./thread-utils";

function initials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join("");
}

/** Square-ish avatar, as chat apps use — distinct from the round ones elsewhere. */
export function Avatar({
  name,
  photoUrl,
  size = 36,
}: {
  name: string;
  photoUrl: string | null;
  size?: number;
}) {
  const box = { width: size, height: size };
  if (photoUrl) {
    return (
      <Image src={photoUrl} alt={name} width={size} height={size} style={box} className="rounded-[4px] object-cover" />
    );
  }
  return (
    <span
      style={box}
      className="flex items-center justify-center rounded-[4px] bg-gradient-to-br from-[#87102C] to-[#6E0C24] text-[11px] font-bold leading-none text-white"
    >
      {initials(name)}
    </span>
  );
}

/** "Today" / "Yesterday" / a date, centred on a hairline between days. */
export function DayDivider({ label }: { label: string }) {
  return (
    <li className="relative my-4 px-5">
      <span className="absolute inset-x-5 top-1/2 h-px bg-gray-200 dark:bg-white/[0.12]" aria-hidden="true" />
      <span className="relative mx-auto block w-fit rounded-full border border-gray-200 bg-white px-3 py-[3px] text-[13px] font-bold text-[#1D1C1D] shadow-sm dark:border-white/[0.12] dark:bg-[#1c1c1e] dark:text-white/80">
        {label}
      </span>
    </li>
  );
}


/**
 * Where someone was moved on, in the thread: integrated (the Integration Team's
 * conversation starts here) or opted out. Past activity stays above it.
 */
export function MilestoneDivider({ status, at }: { status: "INTEGRATED" | "OPTED_OUT"; at: string }) {
  const when = new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const integrated = status === "INTEGRATED";
  return (
    <li className="relative my-5 px-5" aria-label={`${integrated ? "Integrated" : "Opted out"} on ${when}`}>
      <span
        aria-hidden="true"
        className={`absolute inset-x-5 top-1/2 h-0.5 ${integrated ? "bg-emerald-300 dark:bg-emerald-500/40" : "bg-gray-300 dark:bg-white/20"}`}
      />
      <span
        className={`relative mx-auto block w-fit rounded-full px-3.5 py-1 text-center text-xs font-bold shadow-sm ${
          integrated
            ? "bg-emerald-600 text-white dark:bg-emerald-500"
            : "bg-gray-600 text-white dark:bg-white/20"
        }`}
      >
        {integrated ? "Integrated" : "Opted out"} · {when}
        <span className="block text-[11px] font-medium opacity-85">
          {integrated ? "A new conversation starts here — earlier activity is above" : "Earlier activity is above"}
        </span>
      </span>
    </li>
  );
}

/** The time shown in the gutter on a grouped message, only while hovered. */
export function HoverTime({ iso }: { iso: string }) {
  return (
    <span
      title={fullTimestamp(iso)}
      className="absolute left-5 hidden w-8 pr-1 text-right text-[11px] leading-[22px] text-gray-400 group-hover:block dark:text-white/30"
    >
      {timeLabel(iso)}
    </span>
  );
}
