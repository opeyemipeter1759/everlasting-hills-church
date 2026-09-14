"use client";

import { useId } from "react";
import type { Passage } from "@/lib/api/reading-plan";

type ChapterGroup = {
  book: string;
  chapter: number;
  verses: Passage["verses"];
};

export function ChapterPassage({ verses }: { verses: Passage["verses"] }) {
  const passageId = useId();
  const chapters: ChapterGroup[] = [];

  // Group consecutive verses so partial chapters and the passage's reading
  // order stay intact, including when a portion crosses into another book.
  for (const verse of verses) {
    const previous = chapters[chapters.length - 1];
    if (previous?.book === verse.book && previous.chapter === verse.chapter) {
      previous.verses.push(verse);
    } else {
      chapters.push({ book: verse.book, chapter: verse.chapter, verses: [verse] });
    }
  }

  return (
    <div className="space-y-8">
      {chapters.map((chapter, index) => {
        const headingId = `${passageId}-chapter-${index}`;

        return (
          <section
            key={headingId}
            aria-labelledby={headingId}
            className={index > 0 ? "border-t border-[#E7CDD3] pt-6 dark:border-[#FFB3C1]/20" : "pt-2"}
          >
            <h3
              id={headingId}
              className="mb-4 rounded-xl border-l-4 border-[#87102C] bg-[#FFF4F6] px-4 py-3 font-serif text-xl font-bold text-[#87102C] dark:border-[#FFB3C1] dark:bg-[#FFB3C1]/5 dark:text-[#FFB3C1]"
            >
              {chapter.book} {chapter.chapter}
            </h3>
            <div className="space-y-2 text-[15px] leading-relaxed text-gray-800 dark:text-white/80">
              {chapter.verses.map((verse) => (
                <p key={verse.verseId}>
                  <span aria-hidden="true" className="mr-1.5 align-super text-[10px] font-bold text-[#87102C]/70 dark:text-[#FFB3C1]/70">
                    {verse.verse}
                  </span>
                  <span className="sr-only">Verse {verse.verse}. </span>
                  {verse.text}
                </p>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
