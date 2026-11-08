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
    <div role="group" aria-labelledby="hills-confession-title" className="min-w-0 border-t border-[#f5d49a]/25 pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
      <p id="hills-confession-title" className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f5d49a]">
        The Hills Confession
        <span className="font-semibold normal-case tracking-normal text-white/60"> · say it out loud</span>
      </p>
      {sermon && (
        <p className="mt-1 text-xs text-white/60">
          {source} · Word of the Day: <span className="font-semibold text-[#f5d49a]">{sermon.word}</span>
        </p>
      )}

      <p className="mt-2 font-display text-[15px] font-semibold leading-relaxed text-white/90">
        {lines.map((line, index) => (
          <span key={`${index}-${line}`} className="block">
            {index === lines.length - 1 ? <span className="text-[#f5d49a]">{line}</span> : line}
          </span>
        ))}
      </p>

      {sermon && (
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
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
