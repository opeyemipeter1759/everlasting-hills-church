import type { Metadata } from "next";
import { NowProvider } from "@/components/programs/now";
import { ProgramGroups } from "@/components/programs/ProgramGroups";
import { ProgramsHero } from "@/components/programs/ProgramsHero";
import { RhythmStrip } from "@/components/programs/RhythmStrip";
import { getAnchor, getPrograms } from "@/lib/programs";

export const metadata: Metadata = {
  title: "Programs | Everlasting Hills Church",
  description: "The Prayer Watch, Dew of Heaven, Furnace and the rest of the rhythm of Everlasting Hills Church: what is on now, what is next, and how to join.",
};

export const revalidate = 300;

/** /programs: the hero, the rhythm of the house (on now and next), then every program by cadence. */
export default async function ProgramsPage() {
  // At build time the API may be out of reach; render empty then, and let revalidation fill it in.
  // At runtime a failure reaches error.tsx instead of caching an empty page.
  const building = process.env.NEXT_PHASE === "phase-production-build";
  const [programs, anchor] = await Promise.all([
    getPrograms().catch((err) => {
      if (building) return [];
      throw err;
    }),
    getAnchor(),
  ]);
  const renderedAt = new Date().toISOString();
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#080808] text-white selection:bg-[#87102C]">
      <ProgramsHero anchor={anchor} />
      <NowProvider renderedAt={renderedAt}>
        {/* The strip gets only what it needs, so the page ships no scripture text or descriptions twice. */}
        <RhythmStrip programs={programs.map(({ slug, name, schedule, occurrences }) => ({ slug, name, schedule, occurrences }))} />
        <ProgramGroups programs={programs} />
      </NowProvider>
    </main>
  );
}
