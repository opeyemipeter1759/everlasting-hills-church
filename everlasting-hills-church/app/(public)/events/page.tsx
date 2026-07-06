import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { serverApi } from "@/lib/api/server";
import type { EventSummary } from "@/types";
import { getStructuredContent } from "@/lib/cms-page";
import EventsTabs from "./EventsTabs";

export const metadata: Metadata = {
  title: "Events — Everlasting Hills Church",
  description: "Upcoming gatherings, conferences, and special services at Everlasting Hills Church.",
};

interface IntroContent { eyebrow: string; title: string; subtitle: string }
const INTRO_FALLBACK: IntroContent = {
  eyebrow: "Gather with us",
  title: "Events",
  subtitle: "Conferences, special services, and gatherings designed to strengthen faith and build family. We'd love to see you there.",
};
function isIntro(c: unknown): c is IntroContent {
  return Boolean(c && typeof (c as IntroContent).title === "string");
}

async function fetchEvents(): Promise<EventSummary[]> {
  try {
    return await serverApi.get<EventSummary[]>("/events", {
      withAuth: false,
      cache: "no-store",
    });
  } catch {
    return [];
  }
}

export default async function EventsIndexPage({ searchParams }: { searchParams: { preview?: string } }) {
  const [events, intro] = await Promise.all([
    fetchEvents(),
    getStructuredContent("events", { preview: searchParams.preview, fallback: INTRO_FALLBACK, valid: isIntro }),
  ]);

  const now = new Date();
  const upcoming = events.filter((e) => new Date(e.startAt) >= now);
  const past = events.filter((e) => new Date(e.startAt) < now).reverse();

  return (
    <main className="bg-white">
      {searchParams.preview && (
        <div className="bg-[#87102C] text-white text-center text-xs font-semibold py-2 tracking-wide">
          PREVIEW — draft, not published
        </div>
      )}

      {/* Header */}
      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20 px-5 sm:px-8 bg-gradient-to-b from-[#FFF4F6] to-white">
        <div className="max-w-6xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#87102C] mb-3">
            <Sparkles size={14} />
            {intro.eyebrow}
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#111] leading-[1.05] tracking-tight text-balance">
            {intro.title}
          </h1>
          <p className="mt-4 text-[#555] text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            {intro.subtitle}
          </p>
        </div>
      </section>

      <EventsTabs upcoming={upcoming} past={past} />
    </main>
  );
}
