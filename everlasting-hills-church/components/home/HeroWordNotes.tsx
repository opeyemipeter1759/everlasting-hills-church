"use client";

import type { ReactNode } from "react";
import { BookOpen, Play, Sparkles } from "lucide-react";
import { useDailyScripture } from "@/lib/api/daily-scripture";
import { readyWordOfTheDay, useWordOfTheDay } from "@/lib/sermon-digest";
import { useHillsConfession } from "@/components/sermon-digest/useHillsConfession";
import {
  confessionCaption,
  createConfessionImage,
  createScriptureImage,
  scriptureAndConfessionCaption,
  scriptureCaption,
} from "@/lib/scripture-share";
import NoteShare from "./NoteShare";

const HAND = { fontFamily: "var(--font-dancing)" } as const;

/** A verse that fits on a note: cut at a word boundary, never mid-word. */
export function noteSnippet(text: string, max = 80): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.]$/, "")}…`;
}

/** Today in Lagos, YYYY-MM-DD — the confession image's date before the scripture has loaded. */
function lagosToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date());
}

/**
 * A beacon calling for attention: a glowing dot sending out rings one after
 * another, like a signal. (Tailwind's own `ping` keyframes, slowed and
 * staggered, so no extra config.) Still for people who asked for less motion.
 */
function LiveDot() {
  const ring =
    "absolute -inset-1 rounded-full border-[1.5px] border-church-accent opacity-90 motion-reduce:hidden motion-safe:[animation:ping_1.8s_cubic-bezier(0,0,0.2,1)_infinite]";
  return (
    <span aria-hidden="true" className="relative flex h-2.5 w-2.5 shrink-0">
      <span className={ring} />
      <span className={ring} style={{ animationDelay: "0.6s" }} />
      <span className={ring} style={{ animationDelay: "1.2s" }} />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-church-accent shadow-[0_0_10px_3px_rgba(255,179,193,0.75)]" />
    </span>
  );
}

/**
 * A note pinned to the hero: frosted paper with a strip of tape, tilted like
 * it was stuck on by hand, drifting gently, and straightening up when you
 * reach for it. Motion only for people who haven't asked to reduce it.
 */
function PinnedNote({ tilt, delay, children }: { tilt: "left" | "right"; delay: string; children: ReactNode }) {
  return (
    <div style={{ animationDelay: delay }} className="motion-safe:animate-float">
      <div
        className={`group relative transition duration-500 ease-out hover:rotate-0 hover:-translate-y-1 ${
          tilt === "left" ? "-rotate-3" : "rotate-3"
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute -top-3 left-1/2 z-10 h-6 w-20 -translate-x-1/2 bg-church-accent/30 backdrop-blur-sm ${
            tilt === "left" ? "rotate-3" : "-rotate-3"
          } [clip-path:polygon(3%_0,97%_4%,100%_100%,0_94%)]`}
        />
        <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.07] p-5 shadow-[0_24px_60px_-18px_rgba(135,16,44,0.75)] backdrop-blur-md transition duration-500 group-hover:border-church-accent/40 group-hover:bg-white/[0.1] group-hover:shadow-[0_28px_70px_-16px_rgba(255,179,193,0.35)]">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-church-maroon/40 blur-2xl"
          />
          <div className="relative">{children}</div>
        </div>
      </div>
    </div>
  );
}

function NoteLabel({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-church-accent">
      <LiveDot />
      {icon}
      {children}
    </p>
  );
}

/** The Word of the Day in large handwriting, shimmering, with a gold underline that writes itself in. */
function Word({ children, size }: { children: ReactNode; size: string }) {
  return (
    <span className="relative inline-block">
      <span
        style={HAND}
        className={`bg-gradient-to-r from-church-accent via-white to-church-accent bg-[length:200%_100%] bg-clip-text text-transparent motion-safe:animate-gradient-x ${size}`}
      >
        {children}
      </span>
      <svg
        viewBox="0 0 200 16"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute -bottom-1 left-0 h-3 w-full text-[#f5d49a]"
      >
        <path
          d="M3 11 C 50 3, 120 3, 197 8"
          pathLength={1}
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          strokeDasharray="1"
          strokeDashoffset="0"
          className="motion-safe:animate-draw"
        />
      </svg>
    </span>
  );
}

function WatchButton({ href, compact = false }: { href: string; compact?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Watch the sermon"
      className={`relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-church-maroon font-bold text-white shadow-lg shadow-church-maroon/40 transition hover:bg-[#a0143a] ${
        compact ? "px-3 py-1.5 text-[11px]" : "px-4 py-2 text-xs"
      }`}
    >
      <span className="absolute inset-0 w-1/2 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent motion-safe:animate-shine" />
      <Play className="relative h-3 w-3 fill-white" aria-hidden="true" />
      <span className="relative">Watch</span>
    </a>
  );
}

/**
 * The sermon’s confession, small, on the note itself: its first two lines as
 * a taste, ending "…". The full confession is in the Share popup. (line-clamp
 * needs one run of text, so the declarations are joined into one paragraph.)
 */
function SmallConfession({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null;
  return (
    <div className="mt-3 border-l-2 border-church-accent/40 pl-3">
      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/45">Today’s confession</p>
      <p style={HAND} className="mt-1 line-clamp-2 text-[16px] font-bold leading-snug text-white/90">
        {lines.join(" ")}
      </p>
    </div>
  );
}

/** The scripture as it reads in the share popup: in full, not cut short. */
function ScripturePreview({ text, reference }: { text: string; reference: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">Today’s scripture</p>
      <p style={HAND} className="mt-1 text-xl leading-snug text-white/90">
        “{text}”
      </p>
      <p style={HAND} className="mt-1 text-lg text-[#f5d49a]">
        — {reference}
      </p>
    </div>
  );
}

/** The Word of the Day and the full Hills Confession, as they read in the share popup. */
function ConfessionPreview({ word, reference, lines }: { word?: string; reference?: string; lines: string[] }) {
  return (
    <div>
      {word && (
        <div className="mb-3">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">Word of the day</p>
          <Word size="text-4xl leading-tight">{word}</Word>
          {reference && (
            <p style={HAND} className="mt-1 text-base text-white/70">
              {reference}
            </p>
          )}
        </div>
      )}
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">The Hills Confession</p>
      {lines.map((line, index) => (
        <p
          key={`${index}-${line}`}
          style={HAND}
          className={`mt-0.5 text-lg leading-snug ${index === lines.length - 1 ? "text-[#f5d49a]" : "text-white/90"}`}
        >
          {line}
        </p>
      ))}
    </div>
  );
}

/**
 * Today's scripture and the Word of the Day, pinned to the hero as notes that
 * catch the eye. Placed beside the intro text on wide screens
 * (`placement="sides"`, inside a relative wrapper) and as one note under it on
 * smaller ones (`placement="inline"`). Each part stays away until its data is ready.
 */
export default function HeroWordNotes({ placement }: { placement: "sides" | "inline" }) {
  const { data: scripture } = useDailyScripture();
  const { data: word } = useWordOfTheDay();
  const sermonWord = readyWordOfTheDay(word);
  const confession = useHillsConfession(scripture?.date ?? lagosToday());
  if (!scripture && !sermonWord) return null;

  // What each Share button sends: the scripture, the confession (it carries the
  // Word of the Day), or both together on the single phone note.
  const scriptureKey = scripture ? `${scripture.date}|${scripture.reference}|${scripture.translationCode}` : "";
  const confessionKey = JSON.stringify(confession.share);
  const confessionPreview = (
    <ConfessionPreview word={sermonWord?.word} reference={sermonWord?.verse.reference} lines={confession.lines} />
  );
  const shareScripture = scripture && {
    what: "today’s scripture",
    title: "Share today’s scripture",
    preview: <ScripturePreview text={scripture.text} reference={scripture.reference} />,
    drawKey: `scripture|${scriptureKey}`,
    draw: async () => [await createScriptureImage(scripture)],
    caption: () => scriptureCaption(scripture),
  };
  const shareConfession = {
    what: "the Hills Confession and Word of the Day",
    title: "Share the Word of the Day",
    preview: confessionPreview,
    drawKey: `confession|${confessionKey}`,
    draw: async () => [await createConfessionImage(confession.share)],
    caption: () => confessionCaption(confession.share),
  };
  const shareBoth = scripture && {
    what: "today’s scripture and the Hills Confession",
    title: "Share today’s word",
    preview: (
      <div className="space-y-4">
        <ScripturePreview text={scripture.text} reference={scripture.reference} />
        <div className="border-t border-white/10 pt-4">{confessionPreview}</div>
      </div>
    ),
    drawKey: `both|${scriptureKey}|${confessionKey}`,
    draw: () => Promise.all([createScriptureImage(scripture), createConfessionImage(confession.share)]),
    caption: () => scriptureAndConfessionCaption(scripture, confession.share),
  };

  const sermonDay =
    sermonWord?.serviceDay === "WEDNESDAY" ? "Wednesday’s" : sermonWord?.serviceDay === "SUNDAY" ? "Sunday’s" : "our latest";

  if (placement === "inline") {
    return (
      <div style={{ animationDelay: "760ms" }} className="opacity-0 animate-fade-up mx-auto mt-8 w-full max-w-sm text-left xl:hidden">
        <PinnedNote tilt="left" delay="0ms">
          {scripture && (
            <>
              <NoteLabel icon={<BookOpen className="h-3 w-3" aria-hidden="true" />}>Today’s scripture</NoteLabel>
              <p style={HAND} className="mt-2 text-xl leading-snug text-white/90">
                “{noteSnippet(scripture.text, 90)}”
              </p>
              <p style={HAND} className="mt-1 text-lg text-[#f5d49a]">
                — {scripture.reference}
              </p>
            </>
          )}
          {sermonWord && (
            <div className={scripture ? "mt-4 border-t border-white/10 pt-4" : ""}>
              <NoteLabel icon={<Sparkles className="h-3 w-3" aria-hidden="true" />}>Word of the day</NoteLabel>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <Word size="text-3xl">{sermonWord.word}</Word>
                <WatchButton href={sermonWord.watchUrl} compact />
              </div>
              <SmallConfession lines={sermonWord.confession} />
            </div>
          )}
          <div className="mt-4 border-t border-white/10 pt-3">
            <NoteShare compact {...(sermonWord ? (shareBoth ?? shareConfession) : shareScripture!)} />
          </div>
        </PinnedNote>
      </div>
    );
  }

  return (
    <>
      {scripture && (
        <aside
          aria-label="Today’s scripture"
          style={{ animationDelay: "1150ms" }}
          className="opacity-0 animate-fade-in absolute right-full top-1/2 z-20 mr-10 hidden w-[250px] -translate-y-1/2 text-left xl:block"
        >
          <PinnedNote tilt="left" delay="0ms">
            <NoteLabel icon={<BookOpen className="h-3 w-3" aria-hidden="true" />}>Today’s scripture</NoteLabel>
            <p style={HAND} className="mt-3 text-[22px] leading-snug text-white/90">
              “{noteSnippet(scripture.text)}”
            </p>
            <p style={HAND} className="mt-2 text-lg text-[#f5d49a]">
              — {scripture.reference}
            </p>
            {shareScripture && (
              <div className="mt-4">
                <NoteShare {...shareScripture} />
              </div>
            )}
          </PinnedNote>
        </aside>
      )}

      {sermonWord && (
        <aside
          aria-label="Word of the Day"
          style={{ animationDelay: "1350ms" }}
          className="opacity-0 animate-fade-in absolute left-full top-1/2 z-20 ml-10 hidden w-[250px] -translate-y-1/2 text-left xl:block"
        >
          <PinnedNote tilt="right" delay="-3s">
            <NoteLabel icon={<Sparkles className="h-3 w-3" aria-hidden="true" />}>Word of the day</NoteLabel>
            <div className="mt-2">
              <Word size="text-3xl leading-tight">{sermonWord.word}</Word>
            </div>
            {sermonWord.verse.reference && (
              <p style={HAND} className="mt-2 text-lg text-white/80">
                {sermonWord.verse.reference}
              </p>
            )}
            <p className="mt-1 text-[11px] text-white/50">From {sermonDay} sermon</p>
            <SmallConfession lines={sermonWord.confession} />
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <WatchButton href={sermonWord.watchUrl} />
              <NoteShare {...shareConfession} />
            </div>
          </PinnedNote>
        </aside>
      )}
    </>
  );
}
