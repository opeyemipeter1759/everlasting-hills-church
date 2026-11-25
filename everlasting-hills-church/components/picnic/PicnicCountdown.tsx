"use client";

import { useEffect, useState } from "react";

/** Days · hours · minutes to the day, ticking each second. `offsetMs` corrects a wrong device clock. */
export default function Countdown({ target, offsetMs = 0 }: { target: string; offsetMs?: number }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now() + offsetMs);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [offsetMs]);

  const ms = now === null ? 0 : Math.max(0, Date.parse(target) - now);
  const parts = [
    { label: "Days", value: Math.floor(ms / 86_400_000) },
    { label: "Hours", value: Math.floor(ms / 3_600_000) % 24 },
    { label: "Minutes", value: Math.floor(ms / 60_000) % 60 },
    { label: "Seconds", value: Math.floor(ms / 1000) % 60 },
  ];

  return (
    <div aria-label="Time until the picnic" className="grid grid-cols-4 divide-x divide-[#F7F0E3]/15 border-y border-[#F7F0E3]/15">
      {parts.map((p) => (
        <div key={p.label} className="px-2 py-4 text-center sm:py-5">
          <p className="font-serif text-4xl tabular-nums text-[#F7F0E3] sm:text-5xl">
            {now === null ? "–" : String(p.value).padStart(2, "0")}
          </p>
          <p className="mt-1.5 text-xs font-medium text-[#F7F0E3]/55">{p.label}</p>
        </div>
      ))}
    </div>
  );
}
