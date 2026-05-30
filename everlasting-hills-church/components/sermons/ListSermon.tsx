"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Play, ArrowRight, Layers3, Video, Headphones, Sparkles, X, Bookmark, PenLine, ChevronDown, ChevronUp, SkipBack, SkipForward, Pause, LoaderCircle } from "lucide-react";
import AllSermons from "./AllSermons";
import SeriesLibrary from "./SeriesLibrary";
import SermonCard from "./SermonCard";
import { getSeriesName, formatDuration } from "./sermonUtils";
import { getFrontendSessionUser } from "@/lib/auth/frontend-session";
import type { LatestSermon } from "@/types";

type SermonCategory = {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof Layers3;
  items: LatestSermon[];
};



const DUMMY_SERMONS: LatestSermon[] = [
  {
    id: "s1",
    tenantId: "1",
    title: "Jesus - The Lion and the Lamb",
    speaker: "Yeshua",
    date: "2026-04-05",
    audioUrl: "/audio/lion-and-lamb.mp3",
    videoUrl: null,
    thumbnailUrl: "https://images.unsplash.com/photo-1514223820386-6ff0a5d7f9d9?auto=format&fit=crop&w=1400&q=80",
    description: "A worship-rich message about power, grace, and the beauty of Christ.",
    publishedAt: "2026-04-05",
    createdAt: "2026-04-05",
    audioDuration: 3495,
    audioKey: null,
    isFeatured: true,
    playCount: 458,
    scheduledFor: null,
    scriptureRef: "Revelation 5:5-6",
    series: "Easter",
    seriesSlug: "easter",
    slug: "jesus-the-lion-and-the-lamb",
    status: "published",
    tags: ["worship", "easter"],
    transcript: null,
    updatedAt: "2026-04-05",
  },
  {
    id: "s2",
    tenantId: "1",
    title: "Compass",
    speaker: "Ebenezer",
    date: "2026-01-25",
    audioUrl: null,
    videoUrl: "https://youtube.com/watch?v=compass",
    thumbnailUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
    description: "A course-correcting sermon for seasons when direction feels unclear.",
    publishedAt: "2026-01-25",
    createdAt: "2026-01-25",
    audioDuration: null,
    audioKey: null,
    isFeatured: false,
    playCount: 219,
    scheduledFor: null,
    scriptureRef: "Proverbs 3:5-6",
    series: "Direction",
    seriesSlug: "direction",
    slug: "compass",
    status: "published",
    tags: ["wisdom", "direction"],
    transcript: null,
    updatedAt: "2026-01-25",
  },
  {
    id: "s3",
    tenantId: "1",
    title: "Deeper - Ikeja Spiritual Warfare",
    speaker: "Deeper Ikeja",
    date: "2026-07-11",
    audioUrl: "/audio/deeper-ikeja.mp3",
    videoUrl: null,
    thumbnailUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1400&q=80",
    description: "An intense prayer meeting and word session with a vibrant, modern poster style.",
    publishedAt: "2026-07-11",
    createdAt: "2026-07-11",
    audioDuration: 2100,
    audioKey: null,
    isFeatured: true,
    playCount: 319,
    scheduledFor: null,
    scriptureRef: "Ephesians 6:10-18",
    series: "Spiritual Warfare",
    seriesSlug: "spiritual-warfare",
    slug: "deeper-ikeja-spiritual-warfare",
    status: "published",
    tags: ["prayer", "deliverance"],
    transcript: null,
    updatedAt: "2026-07-11",
  },
  {
    id: "s4",
    tenantId: "1",
    title: "Immanuel - Jesus the Man",
    speaker: "Yeshua",
    date: "2026-04-10",
    audioUrl: null,
    videoUrl: "https://youtube.com/watch?v=immanuel",
    thumbnailUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=80",
    description: "The nearness of God, explained through the humanity of Christ.",
    publishedAt: "2026-04-10",
    createdAt: "2026-04-10",
    audioDuration: null,
    audioKey: null,
    isFeatured: false,
    playCount: 275,
    scheduledFor: null,
    scriptureRef: "Matthew 1:23",
    series: "Christmas",
    seriesSlug: "christmas",
    slug: "immanuel-jesus-the-man",
    status: "published",
    tags: ["incarnation", "christmas"],
    transcript: null,
    updatedAt: "2026-04-10",
  },
  {
    id: "s5",
    tenantId: "1",
    title: "The Heart of Generosity",
    speaker: "Pastor Grace",
    date: "2026-05-10",
    audioUrl: "/audio/generosity.mp3",
    videoUrl: null,
    thumbnailUrl: "https://images.unsplash.com/photo-1528747008803-2f1d50a5263b?auto=format&fit=crop&w=1400&q=80",
    description: "Exploring how generosity reshapes a community and the daily rhythms of faith.",
    publishedAt: "2026-05-10",
    createdAt: "2026-05-10",
    audioDuration: 2400,
    audioKey: null,
    isFeatured: true,
    playCount: 342,
    scheduledFor: null,
    scriptureRef: "2 Corinthians 9:6-8",
    series: "Generosity",
    seriesSlug: "generosity",
    slug: "the-heart-of-generosity",
    status: "published",
    tags: ["generosity", "giving"],
    transcript: null,
    updatedAt: "2026-05-11",
  },
  {
    id: "s6",
    tenantId: "1",
    title: "Begin Again",
    speaker: "Pastor Daniel",
    date: "2026-05-03",
    audioUrl: null,
    videoUrl: "https://youtube.com/watch?v=abc123",
    thumbnailUrl: "https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=1400&q=80",
    description: "A message about grace and new starts.",
    publishedAt: "2026-05-03",
    createdAt: "2026-05-03",
    audioDuration: null,
    audioKey: null,
    isFeatured: false,
    playCount: 190,
    scheduledFor: null,
    scriptureRef: "Lamentations 3:22-23",
    series: "Renewal",
    seriesSlug: "renewal",
    slug: "begin-again",
    status: "published",
    tags: ["grace", "renewal"],
    transcript: null,
    updatedAt: "2026-05-04",
  },
  {
    id: "s7",
    tenantId: "1",
    title: "Rooted: The Simple Way of Faith",
    speaker: "Pastor Sunday",
    date: "2026-04-26",
    audioUrl: "/audio/rooted.mp3",
    videoUrl: null,
    thumbnailUrl: "https://images.unsplash.com/photo-1516455207990-7a41ce80f7ee?auto=format&fit=crop&w=1400&q=80",
    description: "Practical steps for a faith that lasts.",
    publishedAt: "2026-04-26",
    createdAt: "2026-04-26",
    audioDuration: 1620,
    audioKey: null,
    isFeatured: false,
    playCount: 412,
    scheduledFor: null,
    scriptureRef: "Psalm 1",
    series: "Rooted",
    seriesSlug: "rooted",
    slug: "rooted-simple-faith",
    status: "published",
    tags: ["faith", "growth"],
    transcript: null,
    updatedAt: "2026-04-27",
  },
  {
    id: "s8",
    tenantId: "1",
    title: "When Hope Shows Up",
    speaker: "Guest Speaker",
    date: "2026-04-19",
    audioUrl: null,
    videoUrl: "https://youtube.com/watch?v=def456",
    thumbnailUrl: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1400&q=80",
    description: "Stories of hope and the small miracles in ordinary life.",
    publishedAt: "2026-04-19",
    createdAt: "2026-04-19",
    audioDuration: null,
    audioKey: null,
    isFeatured: false,
    playCount: 87,
    scheduledFor: null,
    scriptureRef: "Romans 15:13",
    series: null,
    seriesSlug: null,
    slug: "when-hope-shows-up",
    status: "published",
    tags: ["hope", "testimony"],
    transcript: null,
    updatedAt: "2026-04-20",
  },
  {
    id: "s9",
    tenantId: "1",
    title: "Steady Hands",
    speaker: "Pastor Grace",
    date: "2026-04-12",
    audioUrl: "/audio/steady-hands.mp3",
    videoUrl: null,
    thumbnailUrl: "https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?auto=format&fit=crop&w=1400&q=80",
    description: "Finding calm in chaotic seasons.",
    publishedAt: "2026-04-12",
    createdAt: "2026-04-12",
    audioDuration: 1980,
    audioKey: null,
    isFeatured: false,
    playCount: 221,
    scheduledFor: null,
    scriptureRef: "Philippians 4:6-7",
    series: "Steady",
    seriesSlug: "steady",
    slug: "steady-hands",
    status: "published",
    tags: ["peace", "prayer"],
    transcript: null,
    updatedAt: "2026-04-13",
  },
  {
    id: "s10",
    tenantId: "1",
    title: "Called to Community",
    speaker: "Pastor Daniel",
    date: "2026-04-05",
    audioUrl: null,
    videoUrl: "https://youtube.com/watch?v=ghi789",
    thumbnailUrl: "https://images.unsplash.com/photo-1495121605193-b116b5b09a6b?auto=format&fit=crop&w=1400&q=80",
    description: "How church forms us into a people for the world.",
    publishedAt: "2026-04-05",
    createdAt: "2026-04-05",
    audioDuration: null,
    audioKey: null,
    isFeatured: false,
    playCount: 153,
    scheduledFor: null,
    scriptureRef: "Acts 2",
    series: "Community",
    seriesSlug: "community",
    slug: "called-to-community",
    status: "published",
    tags: ["church", "community"],
    transcript: null,
    updatedAt: "2026-04-06",
  },
];

// SermonCard moved to ./SermonCard.tsx

export default function ListSermon() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const session = getFrontendSessionUser();
  const [last, setLast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"home" | "series">("home");
  const [selectedSeries, setSelectedSeries] = useState<null | { title: string; items: LatestSermon[] }>(null);
  const [activeSermon, setActiveSermon] = useState<LatestSermon | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [noteOpen, setNoteOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const slug = typeof window !== "undefined" ? localStorage.getItem("ehc.lastSermon") : null;
    setLast(slug);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const storedBookmarks = window.localStorage.getItem("ehc.sermon.bookmarks");
      const storedNotes = window.localStorage.getItem("ehc.sermon.notes");

      if (storedBookmarks) setBookmarks(JSON.parse(storedBookmarks));
      if (storedNotes) setNotes(JSON.parse(storedNotes));
    } catch {
      // Ignore storage parsing issues and start from a clean state.
    }
  }, []);

  function saveLast(slug?: string) {
    if (typeof window === "undefined") return;
    if (slug) localStorage.setItem("ehc.lastSermon", slug);
    else localStorage.removeItem("ehc.lastSermon");
    setLast(slug ?? null);
  }

  const formatClock = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
    const total = Math.floor(seconds);
    const hours = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    if (hours > 0) return `${hours}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  function persistBookmarks(next: string[]) {
    setBookmarks(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ehc.sermon.bookmarks", JSON.stringify(next));
    }
  }

  function persistNotes(next: Record<string, string>) {
    setNotes(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ehc.sermon.notes", JSON.stringify(next));
    }
  }

  function handlePlay(sermon: LatestSermon) {
    setActiveSermon(sermon);
    setNoteOpen(false);
    setNoteDraft(notes[sermon.slug] ?? "");
    setIsMinimized(false);
    saveLast(sermon.slug);
  }

  function toggleBookmark(sermon: LatestSermon) {
    const next = bookmarks.includes(sermon.slug)
      ? bookmarks.filter((slug) => slug !== sermon.slug)
      : [...bookmarks, sermon.slug];
    persistBookmarks(next);
  }

  function saveNote(sermon: LatestSermon) {
    const value = noteDraft.trim();
    if (!value) return;
    persistNotes({ ...notes, [sermon.slug]: value });
    setNoteDraft("");
  }

  function handleSeek(event: React.ChangeEvent<HTMLInputElement>) {
    const nextTime = Number(event.target.value);
    setCurrentTime(nextTime);
    if (audioRef.current) {
      audioRef.current.currentTime = nextTime;
    }
  }

  async function togglePlayback() {
    if (!activeSermon?.audioUrl || !audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    try {
      setIsLoading(true);
      await audioRef.current.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }

  function skipBy(amount: number) {
    if (!audioRef.current) return;
    const nextTime = Math.min(Math.max(audioRef.current.currentTime + amount, 0), duration || audioRef.current.duration || 0);
    audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  useEffect(() => {
    if (!activeSermon?.audioUrl || !audioRef.current) return;

    const audio = audioRef.current;
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
      setDuration(audio.duration || 0);
    };
    const onEnded = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, [activeSermon?.audioUrl]);

  useEffect(() => {
    if (!activeSermon?.audioUrl || !audioRef.current) return;
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setIsLoading(false);
    audioRef.current.pause();
    audioRef.current.src = activeSermon.audioUrl;
    audioRef.current.load();
  }, [activeSermon?.audioUrl, activeSermon?.slug]);

  const categories = useMemo<SermonCategory[]>(() => {
    const sermons = DUMMY_SERMONS.slice().sort((a, b) => {
      const left = new Date(b.publishedAt ?? b.createdAt).getTime();
      const right = new Date(a.publishedAt ?? a.createdAt).getTime();
      return left - right;
    });

    return [
      {
        id: "all",
        title: "All Messages",
        subtitle: "Every sermon in one place",
        icon: Layers3,
        items: sermons,
      },
    ];
  }, []);

  const sections = useMemo(() => {
    const bySeries = new Map<string, LatestSermon[]>();
    DUMMY_SERMONS.forEach((item) => {
      const key = getSeriesName(item);
      const existing = bySeries.get(key) ?? [];
      existing.push(item);
      bySeries.set(key, existing);
    });

    return Array.from(bySeries.entries()).map(([series, items]) => ({
      id: `series-${series.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      title: series,
      subtitle: `${items.length} sermon${items.length > 1 ? "s" : ""} in this collection`,
      icon: Layers3,
      items,
    }));
  }, []);

  const anchorChips = [
    { id: "home", title: "Home", icon: Layers3 },
    { id: "series", title: "Series", icon: Sparkles },
  ];

  const seriesGroups = sections;

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 rounded-[26px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-black">
              Sermon Library
            </div>
            <h2 className="text-3xl font-black mt-3 tracking-tight text-black sm:text-[2.5rem]">
              Browse sermons by category
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/52 sm:text-[15px]">
              A fuller library view inspired by music apps: compact cards, clear categories, and quick access to audio or video messages.
            </p>
          </div>

          {session?.loggedIn && last ? (
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 p-3">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-white/45">Continue listening</div>
                <div className="mt-1 text-sm font-semibold text-white">{session.fullName ?? session.email}</div>
              </div>
              <Link href={`/sermons/${last}`} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#87102C] transition-transform hover:-translate-y-0.5">
                <Play className="h-4 w-4 fill-current" />
                Resume
              </Link>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 ">
          {anchorChips.map((chip) => {
            const Icon = chip.icon;
            const isActive = chip.id === activeTab;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setActiveTab(chip.id as "home" | "series")}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-all duration-200 ${
                  isActive 
                     ? "border-white/10 bg-black/20 text-[#87102C] font-bold "
                     :"border-white/20 bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.14)]"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-[#87102C]" : "text-[#FFB3C1]"}`} />
                {chip.title}
                {isActive ? <span className="ml-1 h-2 w-2 rounded-full bg-[#87102C]" /> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-10">
        {activeTab === "home" ? (
          <AllSermons items={categories[0]?.items ?? []} onPlay={handlePlay} />
        ) : (
          <>
            {selectedSeries ? (
              <div className="col-span-full">
                <div className="relative rounded-[18px] border border-white/8 bg-[#0b0b0b] p-6 shadow-[0_14px_32px_rgba(0,0,0,0.24)]">
                  <div className="mb-6 flex items-start gap-6">
                    <div className="relative h-40 w-40 flex-shrink-0 overflow-hidden rounded-lg">
                      <img src={selectedSeries.items[0]?.thumbnailUrl ?? "/fallback.jpg"} alt={selectedSeries.title} className="h-full w-full object-cover" />
                      <div className="absolute right-3 top-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#87102C] text-white">
                        <Play className="h-5 w-5" />
                      </div>
                    </div>

                    <div>
                      <div className="text-sm uppercase text-white/45">Series</div>
                      <h3 className="mt-2 text-4xl font-black text-white">{selectedSeries.title}</h3>
                      <div className="mt-2 text-sm text-white/60">{new Date(selectedSeries.items[0]?.publishedAt ?? selectedSeries.items[0]?.date ?? Date.now()).toLocaleString(undefined, { month: 'long', year: 'numeric' })} • {selectedSeries.items.length} sermon{selectedSeries.items.length > 1 ? 's' : ''} • {Math.max(1, Math.round((selectedSeries.items.reduce((s, i) => s + (i.audioDuration ?? 0), 0) || 0) / 60))} Mins</div>
                    </div>

                    <button onClick={() => setSelectedSeries(null)} aria-label="Close series" className="absolute right-4 top-4 inline-flex items-center justify-center rounded-full bg-white/6 p-2 text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div>
                    <div className="mb-3 grid grid-cols-[auto,1fr,auto] items-center gap-4 border-t border-white/6 pt-3 text-white/60">
                      <div className="text-sm font-semibold">Title</div>
                      <div />
                      <div className="text-sm font-semibold text-right">Duration</div>
                    </div>

                    <div className="divide-y divide-white/6">
                      {selectedSeries.items.map((ser) => (
                        <div key={ser.id} className="flex items-center gap-4 py-4">
                          <img src={ser.thumbnailUrl ?? '/fallback.jpg'} alt={ser.title} className="h-12 w-12 rounded-md object-cover" />
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-white/92">{ser.title}</div>
                            <div className="text-xs text-white/50">{new Date(ser.publishedAt ?? ser.date ?? ser.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                          </div>
                          <div className="ml-auto text-sm text-white/50">{formatDuration(ser.audioDuration)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <SeriesLibrary sections={seriesGroups} onSelect={(s) => setSelectedSeries(s)} />
            )}
          </>
        )}
      </div>

      {activeSermon ? (
        <div className="fixed inset-x-0 bottom-0 z-50 ">
          <div className="mx-auto max-w-[1440px] overflow-hidden  border border-white/10 bg-black shadow-[0_24px_90px_rgba(0,0,0,0.52)] backdrop-blur-2xl">
            <div className="h-[2px] w-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.26),#87102C,rgba(255,255,255,0.26),transparent)]" />
            <audio ref={audioRef} preload="metadata" className="hidden" />
            <div className={`grid gap-4 p-4 sm:p-5 ${noteOpen ? "lg:grid-cols-[1fr_380px]" : ""}`}>
              <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-4">
                  <img src={activeSermon.thumbnailUrl ?? "/fallback.jpg"} alt={activeSermon.title} className="h-16 w-16 rounded-2xl object-cover shadow-[0_12px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/10" />
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                      Now Playing
                    </div>
                    <h4 className="mt-2 truncate text-base font-semibold text-white sm:text-[1.05rem]">{activeSermon.title}</h4>
                    <p className="truncate text-sm text-white/50">{activeSermon.speaker} • {activeSermon.series ?? "Standalone"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMinimized((current) => !current)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
                    aria-label={isMinimized ? "Expand player" : "Minimize player"}
                  >
                    {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSermon(null)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
                    aria-label="Close player"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {!isMinimized ? (
                <>
                  <div className="grid gap-3 lg:grid-cols-[auto,1fr,auto] lg:items-center">
                    <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                      <button type="button" onClick={() => skipBy(-10)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/75 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white" aria-label="Skip back 10 seconds">
                        <SkipBack className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={togglePlayback} className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#87102C] shadow-[0_12px_28px_rgba(255,255,255,0.14)] transition-transform hover:-translate-y-0.5" aria-label={isPlaying ? "Pause" : "Play"}>
                        {isLoading ? <LoaderCircle className="h-6 w-6 animate-spin" /> : isPlaying ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current" />}
                      </button>
                      <button type="button" onClick={() => skipBy(10)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/75 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white" aria-label="Skip forward 10 seconds">
                        <SkipForward className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-2 rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                      <div className="flex items-center justify-between text-[11px] text-white/40">
                        <span>{formatClock(currentTime)}</span>
                        <span>{formatClock(duration || activeSermon.audioDuration || 0)}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={Math.max(duration || activeSermon.audioDuration || 0, 1)}
                        step={1}
                        value={Math.min(currentTime, duration || activeSermon.audioDuration || 0)}
                        onChange={handleSeek}
                        className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-[#87102C]"
                        aria-label="Seek playback"
                      />
                      <div className="flex items-center justify-between gap-2 text-xs text-white/40">
                        <span>{activeSermon.playCount} plays</span>
                        <span>{activeSermon.series ?? "Standalone"}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-end">
                      {session?.loggedIn ? (
                        <button
                          type="button"
                          onClick={() => toggleBookmark(activeSermon)}
                          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${bookmarks.includes(activeSermon.slug) ? "border-[#87102C]/60 bg-[#87102C]/18 text-white" : "border-white/10 bg-white/5 text-white/75 hover:border-white/20 hover:bg-white/10 hover:text-white"}`}
                          aria-label={bookmarks.includes(activeSermon.slug) ? "Remove bookmark" : "Bookmark sermon"}
                        >
                          <Bookmark className={`h-4 w-4 ${bookmarks.includes(activeSermon.slug) ? "fill-current" : ""}`} />
                          {bookmarks.includes(activeSermon.slug) ? "Bookmarked" : "Bookmark"}
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => setNoteOpen((current) => !current)}
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${noteOpen ? "border-white/25 bg-white text-black" : "border-white/10 bg-white/5 text-white/75 hover:border-white/20 hover:bg-white/10 hover:text-white"}`}
                        aria-expanded={noteOpen}
                        aria-label="Add comment"
                      >
                        <PenLine className="h-4 w-4" />
                        Comment
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
              </div>

              {noteOpen ? (
                <aside className="rounded-[24px] border border-white/10 bg-black p-4 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">Comment</div>
                      <h5 className="mt-1 text-sm font-semibold text-white">Drop a note on this sermon</h5>
                      <p className="mt-1 text-xs leading-relaxed text-white/40">This panel sits beside the player for a cleaner, more standard layout.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNoteOpen(false)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
                      aria-label="Close comment panel"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>

                  <textarea
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value)}
                    placeholder="Write a note or comment..."
                    className="min-h-[168px] w-full resize-none rounded-2xl border border-white/10 bg-[#070707] p-4 text-sm text-white outline-none placeholder:text-white/30"
                  />

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="text-xs leading-relaxed text-white/35">
                      {notes[activeSermon.slug] ? "Saved note available" : "No saved note yet"}
                    </div>
                    <button
                      type="button"
                      onClick={() => saveNote(activeSermon)}
                      className="inline-flex items-center justify-center rounded-full bg-white px-4 py-3 text-sm font-semibold text-[#87102C] transition-transform hover:-translate-y-0.5"
                    >
                      Save comment
                    </button>
                  </div>
                </aside>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

