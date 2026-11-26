"use client";

import Link from "next/link";
import { Clock, Icon, Microphone, Play, SpeakerHigh } from "@/components/icons";
import SermonCover from "../SermonCover";
import type { LatestSermon } from "@/types";
import { cardDate, cleanText, clockDuration, seriesName, speakerName } from "./sermon-library";

const KICKER = "text-[10px] font-bold uppercase tracking-[0.2em]";
const META = "text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#8A7A7E]";
const BUTTON = "inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-4 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors";

/** dd.mm.yyyy, the kicker when a sermon isn't part of a series. */
const dotted = (iso: string) => {
  const d = new Date(iso);
  return [d.getDate(), d.getMonth() + 1].map((n) => String(n).padStart(2, "0")).join(".") + `.${d.getFullYear()}`;
};

/** One sermon in the library grid: cover, what it is, who and when, then Watch / Listen. */
export default function SermonLibraryCard({ s, onListen }: { s: LatestSermon; onListen: (slug: string) => void }) {
  const title = cleanText(s.title);
  const series = seriesName(s);
  const length = clockDuration(s.audioDuration);
  const page = `/sermons/${s.slug}`;
  const source = s.videoUrl ? "YouTube" : s.audioUrl ? "Audio" : null;
  // The cover plays: the video when there is one, otherwise the audio.
  const coverLinks = !!s.videoUrl || !s.audioUrl;
  const cover = (
    <>
      {s.thumbnailUrl ? (
        <SermonCover src={s.thumbnailUrl} alt="" sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 440px" imageClassName="transition-transform duration-500 group-hover:scale-[1.03]" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-[#87102C]/15">
          <Icon icon={Microphone} size={64} weight="thin" />
        </span>
      )}
      <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#2B0A13] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-110">
        <Icon icon={Play} size={18} weight="fill" className="translate-x-[1px]" />
      </span>
    </>
  );
  const coverClass = `group relative block aspect-video w-full overflow-hidden ${s.thumbnailUrl ? "bg-[#1B0A0F]" : "bg-[#F4EEEF]"}`;

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-[#EADFE2] bg-white shadow-[0_1px_2px_rgba(43,10,19,0.04)] transition-shadow duration-300 hover:shadow-[0_14px_32px_-20px_rgba(43,10,19,0.35)]">
      {coverLinks ? (
        <Link href={page} className={coverClass} aria-label={`Watch ${title}`}>{cover}</Link>
      ) : (
        <button type="button" onClick={() => onListen(s.slug)} className={coverClass} aria-label={`Listen to ${title}`}>{cover}</button>
      )}

      <div className="flex flex-1 flex-col p-5">
        <p className={`flex min-w-0 items-center gap-2 text-[#87102C] ${KICKER}`}>
          <span className="truncate">{series ?? dotted(s.date || s.publishedAt)}</span>
          {source && <><span className="text-[#87102C]/35" aria-hidden="true">·</span><span className="flex-shrink-0">{source}</span></>}
        </p>
        <h3 className="mt-2 font-jakarta text-[15px] font-extrabold uppercase leading-[1.35] tracking-[0.005em] text-[#2B0A13] line-clamp-2">
          <Link href={page} className="hover:text-[#87102C]">{title}</Link>
        </h3>
        {s.description && (
          <p className="mt-2 font-serif text-[14px] leading-[1.6] text-[#7A5D64] line-clamp-2">{cleanText(s.description)}</p>
        )}

        <div className="mt-auto pt-4">
          <p className={`flex min-w-0 items-center gap-2 border-t border-[#EFE5E8] pt-3.5 ${META}`}>
            <span className="truncate">{speakerName(s)}</span>
            <span aria-hidden="true">·</span>
            <span className="flex-shrink-0">{cardDate(s.date || s.publishedAt)}</span>
          </p>
          <div className="mt-3.5 flex items-center gap-2">
            {s.videoUrl && (
              <Link href={page} className={`${BUTTON} bg-[#87102C] text-white hover:bg-[#6E0C24]`}>
                <Icon icon={Play} size={11} weight="fill" /> Watch
              </Link>
            )}
            {s.audioUrl && (
              <button type="button" onClick={() => onListen(s.slug)} className={`${BUTTON} bg-[#F6ECEE] text-[#87102C] hover:bg-[#EFDDE1]`}>
                <Icon icon={SpeakerHigh} size={13} /> Listen
              </button>
            )}
            {length && (
              <span className={`ml-auto inline-flex flex-shrink-0 items-center gap-1 tabular-nums ${META}`}>
                <Icon icon={Clock} size={12} /> <span className="sr-only">Length </span>{length}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
