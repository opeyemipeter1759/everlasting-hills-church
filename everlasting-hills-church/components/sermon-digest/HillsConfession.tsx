"use client";

import { PlayCircle } from "lucide-react";
import { useHillsConfession } from "./useHillsConfession";

/**
 * The Hills Confession, said out loud after the day's scripture — one line per
 * breath, loud enough on the page to be read across a room. Set on the
 * scripture card's dark header. Sharing it lives in the card's share panel.
 */
export default function HillsConfession({ date }: { date: string }) {
  const { lines, sermon, source } = useHillsConfession(date);

  return (
    <div role="group" aria-labelledby="hills-confession-title" className="mt-6 border-t border-[#f5d49a]/30 pt-5">
      <p id="hills-confession-title" className="text-[11px] font-black uppercase tracking-[0.11em] text-[#f5d49a] xs:tracking-[0.22em]">
        The Hills Confession
        <span className="font-semibold normal-case tracking-normal text-white/60"> · say it out loud</span>
      </p>
      {sermon && (
        <p className="mt-1 text-xs text-white/60">
          {source} · Word of the Day: <span className="font-semibold text-[#f5d49a]">{sermon.word}</span>
        </p>
      )}

      <p className="mt-3 max-w-3xl font-display text-lg font-bold leading-snug tracking-tight text-white sm:text-2xl">
        {lines.map((line, index) => (
          <span key={`${index}-${line}`} className="block">
            {index === lines.length - 1 ? <span className="text-[#f5d49a]">{line}</span> : line}
          </span>
        ))}
      </p>

      {sermon && (
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          {sermon.verse.reference && <span className="font-semibold text-[#f5d49a]">{sermon.verse.reference}</span>}
          <a
            href={sermon.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-white/85 underline-offset-4 hover:text-white hover:underline"
          >
            <PlayCircle size={16} aria-hidden="true" />
            Watch “{sermon.sermonTitle}”
          </a>
        </p>
      )}
    </div>
  );
}
