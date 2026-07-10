"use client";

import { useState, useRef } from "react";
import { Mic, Play, Pause } from "lucide-react";
import type { MemberHomeProps } from "./types";
import { iconBg, iconCl, muted } from "./tokens";
import { DAILY_PASTOR_WORDS } from "./content";
import { getDayIndex } from "./helpers";
import { PanelCard } from "./Primitives";

export function PastorWordCard({ pastorWord }: { pastorWord?: MemberHomeProps["pastorWord"] }) {
  const text = pastorWord?.text ?? DAILY_PASTOR_WORDS[getDayIndex() % DAILY_PASTOR_WORDS.length];
  const audioUrl = pastorWord?.audioUrl ?? null;
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function togglePlay() {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { void audioRef.current.play(); setPlaying(true); }
  }

  return (
    <PanelCard kicker="Pastoral" title="Pastor&apos;s Word for Today" icon={Mic}>
      <blockquote className="text-sm text-[#111] dark:text-white leading-[1.75] italic border-l-2 border-[#87102C]/30 dark:border-[#FFB3C1]/20 pl-4">
        &ldquo;{text}&rdquo;
      </blockquote>
      {audioUrl && (
        <div className="flex items-center gap-3 mt-4 p-3.5 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/15 border border-[#E7CDD3]/60 dark:border-[#87102C]/30">
          <audio ref={audioRef} src={audioUrl} onEnded={() => setPlaying(false)} />
          <button
            type="button"
            onClick={togglePlay}
            className={`${iconBg} flex-shrink-0`}
            aria-label={playing ? "Pause" : "Play message"}
          >
            {playing
              ? <Pause size={13} className={iconCl} />
              : <Play size={13} className={iconCl} fill="currentColor" />}
          </button>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#111] dark:text-white">60-second message</p>
            <p className={`text-[11px] ${muted}`}>{playing ? "Playing…" : "Tap to listen"}</p>
          </div>
        </div>
      )}
    </PanelCard>
  );
}
