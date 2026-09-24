"use client";

import { PlayCircle, Sparkles } from "lucide-react";
import { serviceLabel, useWordOfTheDay } from "@/lib/sermon-digest";

/**
 * The Word of the Day from the latest Sunday or Wednesday sermon: the word,
 * what it means, its verse, a reflection and the preacher's own line on it.
 * Its confession is shown with the Hills Confession (SermonConfession).
 * Generated on the API from the service video.
 */
export default function WordOfTheDayCard() {
  const { data, isLoading } = useWordOfTheDay();

  if (isLoading) {
    return (
      <section aria-label="Loading the Word of the Day" className="animate-pulse rounded-2xl bg-[#220d20] p-6">
        <div className="h-3 w-40 rounded bg-white/10" />
        <div className="mt-5 h-10 w-56 rounded bg-white/10" />
        <div className="mt-5 h-20 rounded bg-white/10" />
      </section>
    );
  }

  if (!data?.ready) {
    return (
      <section className="rounded-2xl border border-[#E7CDD3] bg-white p-6 text-center dark:border-white/10 dark:bg-white/5">
        <Sparkles className="mx-auto text-[#87102C] dark:text-[#f5d49a]" size={22} aria-hidden="true" />
        <h3 className="mt-3 font-display text-xl font-bold text-[#211317] dark:text-white">The Word of the Day is on its way</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#6d565b] dark:text-white/60">
          It is drawn from our latest Sunday or Wednesday sermon and appears here a few hours after the service. Check back soon.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="word-of-the-day-title"
      className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#220d20] to-[#740d2b] p-6 text-white shadow-xl shadow-[#87102C]/10 sm:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#f5d49a]">
          <Sparkles size={15} aria-hidden="true" />
          Word of the Day
        </p>
        <p className="text-xs text-white/60">{serviceLabel(data.serviceDay, data.serviceDate)}</p>
      </div>

      <h3 id="word-of-the-day-title" className="mt-4 break-words font-display text-4xl font-bold tracking-tight sm:text-5xl">
        {data.word}
      </h3>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/85">{data.meaning}</p>

      {data.verse.reference && (
        <blockquote className="mt-6 border-l-2 border-[#f5d49a]/60 pl-4">
          {data.verse.text && <p className="font-serif text-lg leading-relaxed">“{data.verse.text}”</p>}
          <cite className="mt-1 block text-sm font-semibold not-italic text-[#f5d49a]">{data.verse.reference}</cite>
        </blockquote>
      )}

      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-white/80">{data.reflection}</p>

      {data.preacherQuote && (
        <figure className="mt-6 rounded-xl bg-white/5 p-4">
          <blockquote className="text-sm italic leading-relaxed text-white/90">“{data.preacherQuote}”</blockquote>
          {data.preacher && <figcaption className="mt-2 text-xs text-white/60">— {data.preacher}</figcaption>}
        </figure>
      )}

      <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2">
        <a
          href={data.watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#f5d49a] px-5 py-3 text-sm font-bold text-[#220d20] transition hover:bg-white"
        >
          <PlayCircle size={18} aria-hidden="true" />
          Watch the sermon
        </a>
        <p className="text-xs text-white/60">
          From “{data.sermonTitle}”{data.preacher ? ` · ${data.preacher}` : ""}
        </p>
      </div>
    </section>
  );
}
