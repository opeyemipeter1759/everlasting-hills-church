"use client";

import Link from "next/link";
import { ArrowRight, Icon, Microphone, Play, SpeakerHigh } from "@/components/icons";
import SermonCover from "../SermonCover";
import type { LatestSermon } from "@/types";
import { cardDate, cleanText, clockDuration, seriesName, speakerName } from "./sermon-library";

const KICKER = "text-[11px] font-bold uppercase tracking-[0.22em]";
const META = "text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A7A7E]";
const BUTTON = "inline-flex h-12 items-center justify-center gap-2 rounded-md px-6 text-[13px] font-bold uppercase tracking-[0.16em] transition-colors";

/** dd.mm.yyyy, the kicker when a sermon isn't part of a series. */
const dotted = (iso: string) => {
  const d = new Date(iso);
  return [d.getDate(), d.getMonth() + 1].map((n) => String(n).padStart(2, "0")).join(".") + `.${d.getFullYear()}`;
};

/** One sermon in the library grid: cover, what it is, who and when, then Watch / Listen / Notes. */
export default function SermonLibraryCard({ s, onListen }: { s: LatestSermon; onListen: (slug: string) => void }) {
  const title = cleanText(s.title);
  const series = seriesName(s);
  const length = clockDuration(s.audioDuration);
  const page = `/sermons/${s.slug}`;
  const source = s.videoUrl ? "YouTube" : s.audioUrl ? "Audio" : null;
  // The cover plays: the video when there is one, otherwise the audio.
  const coverProps = s.videoUrl || !s.audioUrl ? { href: page } : null;
  const cover = (
    <>
      {s.thumbnailUrl ? (
        <span className="absolute inset-x-0 top-1/2 block aspect-video -translate-y-1/2">
          <SermonCover src={s.thumbnailUrl} alt="" sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 420px" imageClassName="transition-transform duration-500 group-hover:scale-[1.03]" />
        </span>
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-[#87102C]/15">
          <Icon icon={Microphone} size={96} weight="thin" />
        </span>
      )}
      <span className="absolute left-1/2 top-1/2 flex h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#2B0A13] shadow-[0_10px_30px_-8px_rgba(0,0,0,0.45)] transition-transform duration-300 group-hover:scale-110">
        <Icon icon={Play} size={26} weight="fill" className="translate-x-[2px]" />
      </span>
    </>
  );
  const coverClass = `group relative block aspect-[4/3] w-full overflow-hidden ${s.thumbnailUrl ? "bg-black" : "bg-[#F4EEEF]"}`;

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-[#EADFE2] bg-white shadow-[0_1px_2px_rgba(43,10,19,0.04)] transition-shadow duration-300 hover:shadow-[0_18px_40px_-24px_rgba(43,10,19,0.35)]">
      {coverProps ? (
        <Link href={coverProps.href} className={coverClass} aria-label={`Watch ${title}`}>{cover}</Link>
      ) : (
        <button type="button" onClick={() => onListen(s.slug)} className={coverClass} aria-label={`Listen to ${title}`}>{cover}</button>
      )}

      <div className="flex flex-1 flex-col px-6 pb-7 pt-7 sm:px-7">
        <p className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[#87102C] ${KICKER}`}>
          <span>{series ?? dotted(s.date || s.publishedAt)}</span>
          {source && <><span className="text-[#87102C]/35" aria-hidden="true">·</span><span>{source}</span></>}
        </p>
        <h3 className="mt-3 font-jakarta text-[21px] font-extrabold uppercase leading-[1.22] tracking-[-0.005em] text-[#2B0A13] line-clamp-3">
          <Link href={page} className="hover:text-[#87102C]">{title}</Link>
        </h3>
        {s.description && (
          <p className="mt-4 font-serif text-[17px] leading-[1.75] text-[#7A5D64] line-clamp-3">{cleanText(s.description)}</p>
        )}

        <div className="mt-auto pt-6">
          <p className={`flex flex-wrap items-center gap-x-2.5 gap-y-1.5 border-t border-[#EADFE2] pt-5 ${META}`}>
            <span>{speakerName(s)}</span>
            <span aria-hidden="true">·</span>
            <span>{cardDate(s.date || s.publishedAt)}</span>
            {length && <><span aria-hidden="true">·</span><span className="tabular-nums">{length}</span></>}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {s.videoUrl && (
              <Link href={page} className={`${BUTTON} bg-[#87102C] text-white hover:bg-[#6E0C24]`}>
                <Icon icon={Play} size={14} weight="fill" /> Watch
              </Link>
            )}
            {s.audioUrl && (
              <button type="button" onClick={() => onListen(s.slug)} className={`${BUTTON} bg-[#F6ECEE] text-[#87102C] hover:bg-[#EFDDE1]`}>
                <Icon icon={SpeakerHigh} size={15} /> Listen
              </button>
            )}
            <Link href={`${page}#notes`} className={`inline-flex items-center gap-1.5 px-1 text-[13px] font-bold uppercase tracking-[0.16em] text-[#87102C] underline decoration-[#87102C]/40 decoration-2 underline-offset-[6px] hover:decoration-[#87102C]`}>
              Notes <Icon icon={ArrowRight} size={14} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
