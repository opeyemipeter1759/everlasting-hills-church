"use client";

import { useState } from "react";
import { ChevronDown, PlayCircle } from "lucide-react";
import type { CourseModule } from "@/lib/courses-data";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

export default function CourseCurriculum({ modules }: { modules: CourseModule[] }) {
  const [openIndex, setOpenIndex] = useState(0);
  const [playingKey, setPlayingKey] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] overflow-hidden">
      <div className="border-b border-gray-100 dark:border-white/8 p-5">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/50">Curriculum</h2>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
        {modules.map((mod, i) => {
          const open = openIndex === i;
          return (
            <div key={mod.title}>
              <button
                type="button"
                onClick={() => setOpenIndex(open ? -1 : i)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-50/50 dark:hover:bg-white/[0.02]"
              >
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{mod.title}</p>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-white/40">{mod.lessons.length} lessons</p>
                </div>
                <ChevronDown size={16} className={`flex-shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
              </button>

              {open && (
                <ul className="space-y-1 px-5 pb-4">
                  {mod.lessons.map((lesson, li) => {
                    const key = `${i}-${li}`;
                    const embedUrl = lesson.videoUrl ? getYouTubeEmbedUrl(lesson.videoUrl) : null;
                    const playing = playingKey === key;

                    return (
                      <li key={lesson.title}>
                        <button
                          type="button"
                          disabled={!embedUrl}
                          onClick={() => setPlayingKey(playing ? null : key)}
                          className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/[0.03] disabled:cursor-default disabled:hover:bg-transparent"
                        >
                          <span className="flex min-w-0 items-center gap-2.5">
                            <PlayCircle
                              size={14}
                              className={`flex-shrink-0 ${embedUrl ? "text-[#87102C] dark:text-[#e8768a]" : "text-gray-300 dark:text-white/20"}`}
                            />
                            <span className="truncate">{lesson.title}</span>
                          </span>
                          <span className="flex-shrink-0 text-xs text-gray-400 dark:text-white/40">{lesson.duration}</span>
                        </button>

                        {playing && embedUrl && (
                          <div className="mt-1.5 aspect-video overflow-hidden rounded-xl">
                            <iframe
                              src={embedUrl}
                              title={lesson.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="h-full w-full"
                            />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
